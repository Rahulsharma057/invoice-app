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
// is only incremented for real when an invoice is actually saved.
exports.previewNextInvoiceNumber = asyncHandler(async (req, res) => {
  const type = req.query.type === "dealer" ? "dealer" : "customer";
  const config = await Config.getSingleton();
  const bucket = config.numbering[type];
  res.json({ invoiceNo: `${bucket.prefix}${String(bucket.nextSeq).padStart(2, "0")}` });
});
