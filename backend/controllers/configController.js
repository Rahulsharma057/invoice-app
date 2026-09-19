const asyncHandler = require("express-async-handler");
const Config = require("../models/Config");

// GET /api/config
exports.getConfig = asyncHandler(async (req, res) => {
  const config = await Config.getSingleton();
  res.json(config);
});

// PUT /api/config
exports.updateConfig = asyncHandler(async (req, res) => {
  const config = await Config.getSingleton();

  const allowed = ["company", "bank", "defaults", "numbering"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      config[key] = { ...config[key].toObject?.() ?? config[key], ...req.body[key] };
    }
  }

  await config.save();
  res.json(config);
});

// GET /api/config/next-invoice-number?type=customer|dealer
// Returns a *preview* of the next number without consuming it — the counter
// is only moved forward when an invoice is actually saved.
//
// Customer and dealer invoices share ONE number series: the prefix depends on the
// type, but the running number is common. If a dealer invoice took 07, the next
// customer invoice gets 08 (and vice versa).
exports.previewNextInvoiceNumber = asyncHandler(async (req, res) => {
  const type = req.query.type === "dealer" ? "dealer" : "customer";
  const config = await Config.getSingleton();

  const { customer, dealer } = config.numbering;

  // The higher of the two counters is always the next free number for both types.
  const seq = Math.max(Number(customer?.nextSeq) || 1, Number(dealer?.nextSeq) || 1);

  const bucket = config.numbering[type];
  res.json({ invoiceNo: `${bucket.prefix}${String(seq).padStart(2, "0")}` });
});