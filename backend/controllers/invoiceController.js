const asyncHandler = require("express-async-handler");
const Invoice = require("../models/Invoice");
const Config = require("../models/Config");
const { generateInvoicePdfBuffer } = require("../utils/generatePdf");
const { computeTotals } = require("../templates/invoiceTemplate");

function withGrandTotal(payload) {
  const t = computeTotals(payload);
  return { ...payload, grandTotal: t.grandTotal };
}

// Create a new invoice
exports.createInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.create(withGrandTotal(req.body));

  // Best-effort: bump the numbering counter for this type so the *next*
  // suggested invoice number moves forward. Never blocks/breaks the save.
  const type = invoice.type === "dealer" ? "dealer" : "customer";
  Config.findByIdAndUpdate("app-config", { $inc: { [`numbering.${type}.nextSeq`]: 1 } }).catch(() => {});

  res.status(201).json(invoice);
});

// GET /api/invoices  — server-side paginated, searchable, sortable list.
// Query params: page (1-based), limit, search, type, sort
exports.getInvoices = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const search = (req.query.search || "").trim();
  const type = req.query.type;
  const sort = req.query.sort || "newest";

  const filter = {};
  if (type === "customer" || type === "dealer") filter.type = type;
  if (search) {
    filter.$or = [
      { invoiceNo: { $regex: search, $options: "i" } },
      { "billTo.name": { $regex: search, $options: "i" } },
      { "shipTo.name": { $regex: search, $options: "i" } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    invoiceNo: { invoiceNo: 1 },
    amountHigh: { grandTotal: -1 },
    amountLow: { grandTotal: 1 },
  };

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

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
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, withGrandTotal(req.body), {
    new: true,
    runValidators: true,
  });
  if (!invoice) return res.status(404).json({ message: "Invoice not found" });
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
