const { body, param, query, validationResult } = require("express-validator");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array().map((e) => e.msg).join(", "),
      errors: errors.array(),
    });
  }
  next();
}

const invoiceIdParam = [param("id").isMongoId().withMessage("Invalid invoice id"), handleValidation];

const invoiceBody = [
  body("invoiceNo").trim().notEmpty().withMessage("Invoice No. is required"),
  body("invoiceDate").trim().notEmpty().withMessage("Invoice Date is required"),
  body("type").optional().isIn(["customer", "dealer"]).withMessage("type must be customer or dealer"),
  body("items").optional().isArray().withMessage("items must be an array"),
  body("cgstPercent").optional().isFloat({ min: 0, max: 100 }),
  body("sgstPercent").optional().isFloat({ min: 0, max: 100 }),
  handleValidation,
];

const listQuery = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("search").optional().isString().trim(),
  query("type").optional().isIn(["customer", "dealer", ""]),
  query("sort").optional().isIn(["newest", "oldest", "invoiceNo", "amountHigh", "amountLow"]),
  handleValidation,
];

module.exports = { invoiceIdParam, invoiceBody, listQuery, handleValidation };
