const express = require("express");
const router = express.Router();
const configController = require("../controllers/configController");

router.get("/", configController.getConfig);
router.put("/", configController.updateConfig);
router.get("/next-invoice-number", configController.previewNextInvoiceNumber);

module.exports = router;
