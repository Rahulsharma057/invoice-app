const asyncHandler = require("express-async-handler");
const Invoice = require("../models/Invoice");
const Config = require("../models/Config");
const { generateInvoicePdfBuffer } = require("../utils/generatePdf");
const { computeTotals } = require("../templates/invoiceTemplate");

function withGrandTotal(payload) {
  const t = computeTotals(payload);
  return { ...payload, grandTotal: t.grandTotal };
}

// Escape user input before using it inside a $regex so characters like ( or [ don't break the query.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================
// INVOICE NUMBER HELPERS
// Customer and dealer invoices share ONE number series.
// The prefix differs per type, the trailing number never repeats:
//   dealer   -> SRF/2026-27/07
//   customer -> SRF/26-27/08
// ============================

// "SRF/26-27/08" -> 8, "SRF/2026-27/010" -> 10, no trailing digits -> null
function getInvoiceSeq(invoiceNo) {
  const match = String(invoiceNo || "").trim().match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : null;
}

// Finds another invoice (of ANY type) that already uses the same trailing number.
async function findSeqConflict(invoiceNo, excludeId) {
  const seq = getInvoiceSeq(invoiceNo);
  if (seq === null) return null;

  const filter = { invoiceNo: { $regex: `(^|\\D)0*${seq}\\s*$` } };
  if (excludeId) filter._id = { $ne: excludeId };

  return Invoice.findOne(filter).select("invoiceNo").lean();
}

function conflictMessage(invoiceNo, conflict) {
  const seq = getInvoiceSeq(invoiceNo);
  return `Invoice number ${seq} is already used by ${conflict.invoiceNo}. Customer and dealer invoices share one number series.`;
}

// Move both counters past the number just used so the next suggestion is always fresh.
// $max is atomic and never moves a counter backwards.
function bumpNumbering(invoiceNo) {
  const seq = getInvoiceSeq(invoiceNo);
  if (seq === null) return;

  const next = seq + 1;

  Config.findByIdAndUpdate("app-config", {
    $max: {
      "numbering.customer.nextSeq": next,
      "numbering.dealer.nextSeq": next,
    },
  }).catch(() => {});
}

// Natural order by the trailing number (7, 8, 9, 10 ...), then by full invoice number.
function compareInvoiceNo(a, b) {
  const sa = getInvoiceSeq(a.invoiceNo);
  const sb = getInvoiceSeq(b.invoiceNo);

  if (sa !== sb) {
    if (sa === null) return 1;
    if (sb === null) return -1;
    return sa - sb;
  }

  const byNo = String(a.invoiceNo || "").localeCompare(String(b.invoiceNo || ""), "en", {
    numeric: true,
  });
  if (byNo !== 0) return byNo;

  return String(a._id).localeCompare(String(b._id));
}

// Create a new invoice
exports.createInvoice = asyncHandler(async (req, res) => {
  const conflict = await findSeqConflict(req.body.invoiceNo);
  if (conflict) {
    return res.status(409).json({ message: conflictMessage(req.body.invoiceNo, conflict) });
  }

  const invoice = await Invoice.create(withGrandTotal(req.body));

  // Best-effort: never blocks/breaks the save.
  bumpNumbering(invoice.invoiceNo);

  res.status(201).json(invoice);
});

// GET /api/invoices  — server-side paginated, searchable, sortable list.
// Query params: page (1-based), limit, search, type, sort
// Default sort is by invoice number (natural order: .../9 comes before .../10).
exports.getInvoices = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const search = (req.query.search || "").trim();
  const type = req.query.type;
  const sort = req.query.sort || "invoiceNo";

  const filter = {};
  if (type === "customer" || type === "dealer") filter.type = type;
  if (search) {
    const pattern = escapeRegex(search);
    filter.$or = [
      { invoiceNo: { $regex: pattern, $options: "i" } },
      { "billTo.name": { $regex: pattern, $options: "i" } },
      { "shipTo.name": { $regex: pattern, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  // `_id` is a tie-breaker so pagination stays stable when values repeat.
  const sortMap = {
    newest: { createdAt: -1, _id: -1 },
    oldest: { createdAt: 1, _id: 1 },
    amountHigh: { grandTotal: -1, _id: 1 },
    amountLow: { grandTotal: 1, _id: 1 },
  };

  let items;
  let total;

  if (sortMap[sort]) {
    [items, total] = await Promise.all([
      Invoice.find(filter).sort(sortMap[sort]).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(filter),
    ]);
  } else {
    // Invoice No. sort (default). Done in code instead of the database so it works on every
    // MongoDB version and sorts numerically. Only ids + invoice numbers are loaded to sort,
    // then just the current page is fetched in full.
    const rows = await Invoice.find(filter).select("invoiceNo").lean();
    rows.sort(compareInvoiceNo);

    total = rows.length;

    const pageIds = rows.slice(skip, skip + limit).map((r) => r._id);
    const docs = await Invoice.find({ _id: { $in: pageIds } }).lean();
    const byId = new Map(docs.map((d) => [String(d._id), d]));

    items = pageIds.map((id) => byId.get(String(id))).filter(Boolean);
  }

  res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
});

// Get single invoice by id
exports.getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });
  res.json(invoice);
});

// Update invoice
exports.updateInvoice = asyncHandler(async (req, res) => {
  const existing = await Invoice.findById(req.params.id).select("invoiceNo").lean();
  if (!existing) return res.status(404).json({ message: "Invoice not found" });

  // Only re-check when the number was actually changed (old data may already overlap).
  if (req.body.invoiceNo && req.body.invoiceNo !== existing.invoiceNo) {
    const conflict = await findSeqConflict(req.body.invoiceNo, req.params.id);
    if (conflict) {
      return res.status(409).json({ message: conflictMessage(req.body.invoiceNo, conflict) });
    }
  }

  const invoice = await Invoice.findByIdAndUpdate(req.params.id, withGrandTotal(req.body), {
    new: true,
    runValidators: true,
  });
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  if (invoice.invoiceNo !== existing.invoiceNo) bumpNumbering(invoice.invoiceNo);

  res.json(invoice);
});

// Delete invoice
exports.deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndDelete(req.params.id);
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });
  res.json({ message: "Invoice deleted" });
});

// Generate & download PDF (3 copies: Original / Duplicate / Triplicate) for a saved invoice
exports.getInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });

  const pdfBuffer = await generateInvoicePdfBuffer(invoice.toObject());

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=Invoice-${invoice.invoiceNo}.pdf`,
    "Content-Length": pdfBuffer.length,
  });
  res.send(pdfBuffer);
});

// Generate PDF directly from request body without saving (live preview / quick download)
exports.previewInvoicePdf = asyncHandler(async (req, res) => {
  const pdfBuffer = await generateInvoicePdfBuffer(req.body);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename=Invoice-Preview.pdf`,
    "Content-Length": pdfBuffer.length,
  });
  res.send(pdfBuffer);
});

// Return computed totals for a given payload (used by frontend live summary)
exports.calculateTotals = asyncHandler(async (req, res) => {
  const totals = computeTotals(req.body);
  res.json(totals);
});

// Get invoice statistics
// These statistics are independent of pagination/search/filter.
exports.getInvoiceStats = asyncHandler(async (req, res) => {
  const stats = await Invoice.aggregate([
    {
      $group: {
        _id: null,

        totalInvoices: {
          $sum: 1,
        },

        customerInvoices: {
          $sum: {
            $cond: [
              { $eq: ["$type", "customer"] },
              1,
              0,
            ],
          },
        },

        dealerInvoices: {
          $sum: {
            $cond: [
              { $eq: ["$type", "dealer"] },
              1,
              0,
            ],
          },
        },

        totalAmount: {
          $sum: {
            $ifNull: ["$grandTotal", 0],
          },
        },
      },
    },
  ]);

  const result = stats[0] || {
    totalInvoices: 0,
    customerInvoices: 0,
    dealerInvoices: 0,
    totalAmount: 0,
  };

  res.json({
    totalInvoices: result.totalInvoices || 0,
    customerInvoices: result.customerInvoices || 0,
    dealerInvoices: result.dealerInvoices || 0,
    totalAmount: result.totalAmount || 0,
  });
});