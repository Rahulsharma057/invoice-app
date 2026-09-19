const mongoose = require("mongoose");

// Singleton document (_id fixed) holding company defaults, bank defaults,
// default terms/tax %, and the auto-incrementing invoice number counters
// for each invoice type. Editable from the frontend "Settings" page so the
// user doesn't have to retype company/bank details on every single invoice.
const ConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "app-config" },

    company: {
      name: { type: String, default: "SUNRISE FOAM INDUSTRIES" },
      address: {
        type: String,
        default:
          "Gata No.297/3, Khata No.139, Sunrise Foam Industries, G T Road, Near Primary School, Khuriyavali Pahasu Road, Khurja-203131",
      },
      gstin: { type: String, default: "09BQDPS4474E4ZH" },
      phone: { type: String, default: "+91 96340 52070" },
      email: { type: String, default: "info@samraddhimattresses.com" },
      website: { type: String, default: "www.samraddhimattresses.com" },
      logo: { type: String, default: "" },
    },

    bank: {
      bankName: { type: String, default: "PUNJAB NATIONAL BANK" },
      accountName: { type: String, default: "SUNRISE FOAM INDUSTRIES" },
      accountNo: { type: String, default: "2247102100000890" },
      ifsc: { type: String, default: "PUNB0224710" },
      branch: { type: String, default: "WAZIDPUR" },
    },

    defaults: {
      placeOfSupply: { type: String, default: "UTTAR PRADESH" },
      cgstPercent: { type: Number, default: 9 },
      sgstPercent: { type: Number, default: 9 },
      terms: {
        type: [String],
        default: [
          "Payment Terms: 50% Advance & 50% After Delivery.",
          "Goods once sold will not be taken back or exchanged.",
          "All disputes are subject to Bulandshahr jurisdiction only.",
          "E-Warranty registration is mandatory for warranty claim.",
        ],
      },
    },

    // Auto invoice-number generator: prefix + running counter per type,
    // e.g. customer -> SRF/26-27/13, dealer -> SRF/2026-27/010
    numbering: {
      customer: {
        prefix: { type: String, default: "SRF/26-27/" },
        nextSeq: { type: Number, default: 1 },
      },
      dealer: {
        prefix: { type: String, default: "SRF/2026-27/" },
        nextSeq: { type: Number, default: 1 },
      },
    },
  },
  { timestamps: true }
);

ConfigSchema.statics.getSingleton = async function () {
  let cfg = await this.findById("app-config");
  if (!cfg) cfg = await this.create({ _id: "app-config" });
  return cfg;
};

module.exports = mongoose.model("Config", ConfigSchema);
