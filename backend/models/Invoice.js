const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    size: { type: String, default: "" },
    hsnCode: { type: String, default: "" },
    qty: { type: Number, default: 0 },
    unit: { type: String, default: "Pcs." },
    rate: { type: Number, default: 0 },
  },
  { _id: false }
);

// One shared sub-schema for Bill To / Ship To.
// `type` on the parent invoice decides which of these fields are
// actually shown on the form + PDF:
//   - "customer" -> name, aadhar, address, pan, mobile
//   - "dealer"   -> name, dealerCode, address, gstin, mobile
// All fields are kept on one schema so switching type never loses data
// the user already typed.
const PartySchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    address: { type: String, default: "" },
    mobile: { type: String, default: "" },
    aadhar: { type: String, default: "" },
    pan: { type: String, default: "" },
    gstin: { type: String, default: "" },
    dealerCode: { type: String, default: "" },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    // "customer" = individual buyer (Aadhar + PAN), "dealer" = B2B dealer (GSTIN + Dealer Code)
    type: { type: String, enum: ["customer", "dealer"], default: "customer", index: true },

    invoiceNo: { type: String, required: true, unique: true, trim: true },
    invoiceDate: { type: String, required: true },
    placeOfSupply: { type: String, default: "" },

    company: {
      name: { type: String, default: "" },
      address: { type: String, default: "" },
      gstin: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      website: { type: String, default: "" },
      logo: { type: String, default: "" }, // base64 data URI or image URL
    },

    billTo: { type: PartySchema, default: () => ({}) },
    shipTo: { type: PartySchema, default: () => ({}) },

    transport: {
      transporter: { type: String, default: "" },
      lrNo: { type: String, default: "" },
      lrDate: { type: String, default: "" },
      vehicleNo: { type: String, default: "" },
      ewayBill: { type: String, default: "" },
    },

    items: { type: [ItemSchema], default: [] },

    discount: { type: Number, default: 0 },
    cgstPercent: { type: Number, default: 9 },
    sgstPercent: { type: Number, default: 9 },

    bank: {
      bankName: { type: String, default: "" },
      accountName: { type: String, default: "" },
      accountNo: { type: String, default: "" },
      ifsc: { type: String, default: "" },
      branch: { type: String, default: "" },
    },

    terms: {
      type: [String],
      default: [
        "Payment Terms: 50% Advance & 50% After Delivery.",
        "Goods once sold will not be taken back or exchanged.",
      ],
    },

    grandTotal: { type: Number, default: 0 }, // denormalised for fast list/search/sort
  },
  { timestamps: true }
);

// Search + sort friendly indexes for the paginated "Saved Invoices" table.
InvoiceSchema.index({ createdAt: -1 });
InvoiceSchema.index({ invoiceNo: "text", "billTo.name": "text", "shipTo.name": "text" });

module.exports = mongoose.model("Invoice", InvoiceSchema);
