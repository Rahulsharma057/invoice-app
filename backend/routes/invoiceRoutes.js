const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { invoiceIdParam, invoiceBody, listQuery } = require("../middleware/validators");

router.post("/", invoiceBody, invoiceController.createInvoice);
router.get("/", listQuery, invoiceController.getInvoices);
router.get("/:id", invoiceIdParam, invoiceController.getInvoiceById);
router.put("/:id", invoiceIdParam, invoiceBody, invoiceController.updateInvoice);
router.delete("/:id", invoiceIdParam, invoiceController.deleteInvoice);
router.get("/:id/pdf", invoiceIdParam, invoiceController.getInvoicePdf);

router.post("/preview/pdf", invoiceController.previewInvoicePdf);
router.post("/preview/totals", invoiceController.calculateTotals);

module.exports = router;
