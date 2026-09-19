const express = require("express");

const router = express.Router();

const invoiceController = require("../controllers/invoiceController");

const {
  invoiceIdParam,
  invoiceBody,
  listQuery,
} = require("../middleware/validators");

/*
=========================================================
CREATE
=========================================================
*/

router.post(
  "/",
  invoiceBody,
  invoiceController.createInvoice
);

/*
=========================================================
LIST
=========================================================
*/

router.get(
  "/",
  listQuery,
  invoiceController.getInvoices
);

/*
=========================================================
STATS
=========================================================
IMPORTANT:
This must come BEFORE /:id
=========================================================
*/

router.get(
  "/stats",
  invoiceController.getInvoiceStats
);

/*
=========================================================
SINGLE INVOICE
=========================================================
*/

router.get(
  "/:id",
  invoiceIdParam,
  invoiceController.getInvoiceById
);

/*
=========================================================
UPDATE
=========================================================
*/

router.put(
  "/:id",
  invoiceIdParam,
  invoiceBody,
  invoiceController.updateInvoice
);

/*
=========================================================
DELETE
=========================================================
*/

router.delete(
  "/:id",
  invoiceIdParam,
  invoiceController.deleteInvoice
);

/*
=========================================================
PDF
=========================================================
*/

router.get(
  "/:id/pdf",
  invoiceIdParam,
  invoiceController.getInvoicePdf
);

/*
=========================================================
PREVIEW PDF
=========================================================
*/

router.post(
  "/preview/pdf",
  invoiceController.previewInvoicePdf
);

/*
=========================================================
CALCULATE TOTALS
=========================================================
*/

router.post(
  "/preview/totals",
  invoiceController.calculateTotals
);

module.exports = router;