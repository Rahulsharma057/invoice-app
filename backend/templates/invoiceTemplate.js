const { amountInWords } = require("../utils/numberToWords");
const defaultLogo = require("../assets/defaultLogo");

function esc(v) {
  if (v === undefined || v === null) return "";

  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function money(n) {
  const num = Number(n) || 0;

  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function computeTotals(invoice) {
  const itemsWithAmount = (invoice.items || []).map((it) => {
    const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);

    return {
      ...it,
      amount,
    };
  });

  const totalBeforeTax = itemsWithAmount.reduce((s, it) => s + it.amount, 0);

  const totalQty = itemsWithAmount.reduce(
    (s, it) => s + (Number(it.qty) || 0),
    0
  );

  const discount = Number(invoice.discount) || 0;

  const taxable = totalBeforeTax - discount;

  const cgstPercent = Number(invoice.cgstPercent) || 0;

  const sgstPercent = Number(invoice.sgstPercent) || 0;

  const cgstAmount = (taxable * cgstPercent) / 100;

  const sgstAmount = (taxable * sgstPercent) / 100;

  const rawTotal = taxable + cgstAmount + sgstAmount;

  const roundedTotal = Math.round(rawTotal);

  const roundOff = roundedTotal - rawTotal;

  return {
    itemsWithAmount,
    totalQty,
    totalBeforeTax,
    discount,
    taxable,
    cgstPercent,
    sgstPercent,
    cgstAmount,
    sgstAmount,
    roundOff,
    grandTotal: roundedTotal,
  };
}

// Bill To / Ship To fields differ by invoice type:
// customer -> Aadhar Number + PAN Number
// dealer   -> Dealer Code + GSTIN
function renderParty(title, party = {}, type) {
  const idLine =
    type === "dealer"
      ? `<div><b>Dealer Code:</b> ${esc(party.dealerCode)}</div>`
      : `<div><b>Aadhar Number:</b> ${esc(party.aadhar)}</div>`;

  const taxLine =
    type === "dealer"
      ? `<div><b>GSTIN:</b> ${esc(party.gstin)}</div>`
      : `<div><b>PAN Number:</b> ${esc(party.pan)}</div>`;

  return `
    <div class="box party-box">
      <div class="box-title">
        ${esc(title)}
      </div>

      <div>
        <b>Name:</b>
        ${esc(party.name)}
      </div>

      ${idLine}

      <div>
        <b>Address:</b>
        ${esc(party.address)}
      </div>

      ${taxLine}

      <div>
        <b>Mobile:</b>
        ${esc(party.mobile)}
      </div>
    </div>
  `;
}

function renderCopy(invoice, copyLabel) {
  const t = computeTotals(invoice);

  const type = invoice.type === "dealer" ? "dealer" : "customer";

  // Total qty shown without trailing zeros (e.g. 12 or 12.5)
  const totalQtyText = (Number(t.totalQty) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

  // Show the unit next to total qty only when every item uses the same unit
  const units = [
    ...new Set(
      t.itemsWithAmount
        .map((it) => String(it.unit || "").trim())
        .filter(Boolean)
    ),
  ];
  const commonUnit = units.length === 1 ? units[0] : "";

  const rows = t.itemsWithAmount
    .map(
      (it, idx) => `
        <tr>
          <td class="center">
            ${idx + 1}
          </td>

          <td class="description-cell">
            ${esc(it.description)}
          </td>

          <td class="center">
            ${esc(it.size)}
          </td>

          <td class="center">
            ${esc(it.hsnCode)}
          </td>

          <td class="center">
            ${esc(it.qty)}
          </td>

          <td class="center">
            ${esc(it.unit)}
          </td>

          <td class="right">
            ${money(it.rate)}
          </td>

          <td class="right">
            Rs. ${money(it.amount)}
          </td>
        </tr>
      `
    )
    .join("");

  const termsList = (invoice.terms || [])
    .map((term) => `<li>${esc(term)}</li>`)
    .join("");

  const logoSrc = invoice.company?.logo || defaultLogo;

  return `
  <section class="page">

    <div class="copy-label">
      ${esc(copyLabel)}
    </div>

    <!-- HEADER -->
    <div class="header">

      <div class="company">

        <img
          class="logo"
          src="${logoSrc}"
          alt="logo"
        />

        <div class="company-text">

          <div class="company-name">
            ${esc(invoice.company?.name) || "COMPANY NAME"}
          </div>

          <div class="company-line company-address">
            ${esc(invoice.company?.address)}
          </div>

          <div class="company-line">
            ${
              invoice.company?.gstin
                ? `<b>GSTIN:</b> ${esc(invoice.company.gstin)}`
                : ""
            }

            ${
              invoice.company?.phone
                ? ` <span class="separator">|</span> <b>Ph.:</b> ${esc(invoice.company.phone)}`
                : ""
            }
          </div>

          <div class="company-line">
            ${
              invoice.company?.email
                ? `<b>Email:</b> ${esc(invoice.company.email)}`
                : ""
            }

            ${
              invoice.company?.website
                ? ` <span class="separator">|</span> ${esc(invoice.company.website)}`
                : ""
            }
          </div>

        </div>
      </div>


      <div class="invoice-badge">

        <div class="badge">
          INVOICE
        </div>

        <table class="meta">

          <tr>
            <td>Invoice No.</td>
            <td>${esc(invoice.invoiceNo)}</td>
          </tr>

          <tr>
            <td>Invoice Date</td>
            <td>${esc(invoice.invoiceDate)}</td>
          </tr>

          <tr>
            <td>Place Supply</td>
            <td>${esc(invoice.placeOfSupply)}</td>
          </tr>

        </table>

      </div>

    </div>

    <!-- BILL / SHIP / TRANSPORT -->
    <div class="three-col">

      ${renderParty("BILL TO", invoice.billTo, type)}

      ${renderParty("SHIP TO", invoice.shipTo, type)}

      <div class="box transport-box">

        <div class="box-title">
          TRANSPORT DETAILS
        </div>

        <div>
          <b>Transporter:</b>
          ${esc(invoice.transport?.transporter)}
        </div>

        <div>
          <b>LR No.:</b>
          ${esc(invoice.transport?.lrNo)}
        </div>

        <div>
          <b>LR Date:</b>
          ${esc(invoice.transport?.lrDate)}
        </div>

        <div>
          <b>Vehicle No.:</b>
          ${esc(invoice.transport?.vehicleNo) || "-"}
        </div>

        <div>
          <b>E-Way Bill:</b>
          ${esc(invoice.transport?.ewayBill) || "-"}
        </div>

        <div>
          <b>Driver Name:</b>
          ${esc(invoice.transport?.driverName) || "-"}
        </div>

        <div>
          <b>Driver Ph. No.:</b>
          ${esc(invoice.transport?.driverPhone) || "-"}
        </div>

      </div>

    </div>

    <!-- ITEMS -->
    <table class="items">

      <thead>
        <tr>
          <th>S.No.</th>
          <th>Product Description</th>
          <th>Size</th>
          <th>HSN Code</th>
          <th>Qty.</th>
          <th>Unit</th>
          <th>Rate (Rs.)</th>
          <th>Amount (Rs.)</th>
        </tr>
      </thead>

      <tbody>

        ${
          rows ||
          `
          <tr>
            <td colspan="8" class="center">
              No items
            </td>
          </tr>
          `
        }

      </tbody>

      <tfoot>
        <tr class="items-total">
          <td colspan="4" class="right">Total</td>
          <td class="center">${totalQtyText}</td>
          <td class="center">${esc(commonUnit)}</td>
          <td></td>
          <td class="right">Rs. ${money(t.totalBeforeTax)}</td>
        </tr>
      </tfoot>

    </table>

    <!-- LOWER SECTION -->
    <div class="lower">

      <!-- LEFT -->
      <div class="left">

        <div class="amount-words">

          <div>
            <b>Amount Chargeable (in words):</b>
          </div>

          <div>
            ${amountInWords(t.grandTotal)}
          </div>

        </div>

        <div class="bank-box">

          <div class="box-title">
            BANK DETAILS
          </div>

          <div>
            Bank Name:
            <b>${esc(invoice.bank?.bankName)}</b>
          </div>

          <div>
            A/c Name:
            <b>${esc(invoice.bank?.accountName)}</b>
          </div>

          <div>
            A/c No.:
            <b>${esc(invoice.bank?.accountNo)}</b>
          </div>

          <div>
            IFSC Code:
            <b>${esc(invoice.bank?.ifsc)}</b>
          </div>

          <div>
            Branch:
            <b>${esc(invoice.bank?.branch)}</b>
          </div>

        </div>

      </div>

      <!-- RIGHT TOTALS -->
      <div class="right-totals">

        <table class="totals">

          <tr>
            <td>Total Amount Before Tax</td>
            <td class="right">Rs. ${money(t.totalBeforeTax)}</td>
          </tr>

          <tr>
            <td>Discount</td>
            <td class="right">${money(t.discount)}</td>
          </tr>

          <tr>
            <td>Taxable Amount</td>
            <td class="right">Rs. ${money(t.taxable)}</td>
          </tr>

          <tr>
            <td>CGST (%)</td>
            <td class="right">${t.cgstPercent}</td>
          </tr>

          <tr>
            <td>CGST Amount</td>
            <td class="right">Rs. ${money(t.cgstAmount)}</td>
          </tr>

          <tr>
            <td>SGST (%)</td>
            <td class="right">${t.sgstPercent}</td>
          </tr>

          <tr>
            <td>SGST Amount</td>
            <td class="right">Rs. ${money(t.sgstAmount)}</td>
          </tr>

          <tr>
            <td>Round Off</td>
            <td class="right">Rs. ${money(t.roundOff)}</td>
          </tr>

          <tr class="grand">
            <td>Total Invoice Amount</td>
            <td class="right">Rs. ${money(t.grandTotal)}</td>
          </tr>

        </table>

      </div>

    </div>

    <!-- TERMS -->
    <div class="terms">

      <div class="box-title">
        Terms &amp; Conditions
      </div>

      <ol>
        ${termsList}
      </ol>

    </div>

    <!-- STAMP / SIGNATURE -->
    <div class="stamp-sign-row">

      <div class="signature">

        <div class="sign-space"></div>

        <div class="sign-line">
          Authorized Signatory
        </div>

        <div>
          <b>
            For ${esc(invoice.company?.name) || "COMPANY NAME"}
          </b>
        </div>

      </div>

    </div>

    <div class="spacer"></div>

    <div class="footer-bar">
      Thank You For Your Business!
    </div>

  </section>
  `;
}

function buildInvoiceHtml(invoice) {
  const copies = [
    "ORIGINAL FOR BUYER",
    "DUPLICATE FOR TRANSPORTER",
    "TRIPLICATE FOR ASSESSEE",
  ];

  const pages = copies.map((c) => renderCopy(invoice, c)).join("\n");

  return `<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8" />

<title>
  Invoice ${esc(invoice.invoiceNo)}
</title>

<style>

  * {
    box-sizing: border-box;
  }

  html,
  body {
    font-family: Cambria, Georgia, serif;
    color: #222;
    margin: 0;
    padding: 0;
  }

  /*
    A4 page:
    210mm x 297mm

    10mm page margin
    = 190mm printable width
    = 277mm printable height
  */

  @page {
    size: A4;
    margin: 10mm;
  }

  /*
    MAIN PAGE
  */

  .page {
    width: 100%;
    max-width: 190mm;
    min-height: 277mm;

    margin: 0 auto;

    padding: 8mm;

    page-break-after: always;

    position: relative;

    display: flex;
    flex-direction: column;

    overflow: hidden;
  }

  .page:last-child {
    page-break-after: auto;
  }

  /*
    COPY LABEL
  */

  .copy-label {
    position: absolute;

    top: 4mm;
    right: 8mm;

    font-size: 10px;
    font-weight: bold;

    color: #555;

    text-transform: uppercase;

    white-space: nowrap;
  }

  /*
    HEADER
  */

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    gap: 10px;

    width: 100%;
    min-width: 0;

    border-bottom: 2px solid #0b5d3b;

    padding-bottom: 7px;
    margin-bottom: 10px;
  }

  /* LEFT COMPANY */

  .company {
    display: flex;
    gap: 9px;

    align-items: flex-start;

    flex: 1 1 auto;
    min-width: 0;

    max-width: calc(100% - 128px);
  }

  .logo {
    width: 52px;
    height: 52px;

    object-fit: contain;

    flex: 0 0 52px;
  }

  .company-text {
    min-width: 0;

    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .company-name {
    font-family: "Times New Roman", Times, serif;

    font-size: 18px;
    font-weight: bold;

    color: #0b5d3b;

    line-height: 1.1;

    margin-bottom: 2px;
  }

  .company-line {
    font-size: 9.5px;

    margin-top: 1.5px;

    line-height: 1.2;

    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .company-address {
    max-width: 100%;
  }

  .separator {
    color: #777;
    margin: 0 2px;
  }

  /* RIGHT INVOICE */

  .invoice-badge {
    text-align: right;

    flex: 0 0 128px;

    width: 128px;
    min-width: 128px;

    padding-top: 1px;
  }

  /* SMALLER INVOICE BUTTON */

  .badge {
    font-family: "Times New Roman", Times, serif;

    background: #0b5d3b;

    color: #fff;

    font-weight: bold;

    font-size: 14px;

    padding: 4px 14px;

    border-radius: 3px;

    display: inline-block;

    margin-bottom: 4px;

    white-space: nowrap;
  }

  /* META TABLE */

  .meta {
    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;
  }

  .meta td {
    font-size: 9.5px;

    padding: 1px 0;

    vertical-align: middle;

    line-height: 1.15;

    overflow-wrap: normal;
    word-break: normal;
  }

  .meta td:first-child {
    color: #555;

    text-align: right;

    padding-right: 6px;

    width: 48%;

    white-space: nowrap;
  }

  .meta td:last-child {
    text-align: left;

    font-weight: 600;

    width: 52%;

    white-space: nowrap;

    overflow: visible;
  }

  /*
    BILL / SHIP / TRANSPORT
  */

  .three-col {
    display: flex;

    gap: 10px;

    width: 100%;

    min-width: 0;

    margin-bottom: 12px;
  }

  .box {
    flex: 1 1 0;

    min-width: 0;

    border: 1px solid #ccc;

    border-radius: 4px;

    padding: 8px;

    font-size: 11px;

    line-height: 1.35;

    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .box-title {
    font-weight: bold;

    color: #0b5d3b;

    border-bottom: 1px solid #ddd;

    margin-bottom: 6px;

    padding-bottom: 3px;

    font-size: 11px;

    text-transform: uppercase;
  }

  /*
    ITEMS TABLE
  */

  table.items {
    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;

    font-size: 11px;

    margin-bottom: 12px;
  }

  table.items th {
    background: #0b5d3b;

    color: #fff;

    padding: 8px 4px;

    text-align: center;

    font-weight: bold;

    font-size: 10.5px;

    vertical-align: middle;

    line-height: 1.25;

    border: 1px solid #0b5d3b;

    border-left-color: rgba(255, 255, 255, 0.35);

    white-space: normal;

    overflow-wrap: normal;

    word-break: normal;
  }

  table.items th:first-child {
    border-left-color: #0b5d3b;
  }

  table.items td {
    border: 1px solid #ddd;

    padding: 6px;

    vertical-align: middle;

    line-height: 1.25;

    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /*
    ITEM COLUMN WIDTHS
  */

  table.items th:nth-child(1),
  table.items td:nth-child(1) {
    width: 7%;
  }

  table.items th:nth-child(2),
  table.items td:nth-child(2) {
    width: 24%;
  }

  table.items th:nth-child(3),
  table.items td:nth-child(3) {
    width: 14%;
  }

  table.items th:nth-child(4),
  table.items td:nth-child(4) {
    width: 12%;
  }

  table.items th:nth-child(5),
  table.items td:nth-child(5) {
    width: 7%;
  }

  table.items th:nth-child(6),
  table.items td:nth-child(6) {
    width: 8%;
  }

  table.items th:nth-child(7),
  table.items td:nth-child(7) {
    width: 12%;
  }

  table.items th:nth-child(8),
  table.items td:nth-child(8) {
    width: 16%;
  }

  /*
    ITEMS TOTAL ROW
  */

  table.items tfoot {
    display: table-row-group;
  }

  table.items tfoot td {
    background: #eaf5ef;

    color: #0b5d3b;

    font-weight: bold;

    border: 1px solid #ddd;

    border-top: 2px solid #0b5d3b;

    padding: 7px 6px;
  }

  /*
    ALIGNMENTS
  */

  .center {
    text-align: center;
  }

  .right {
    text-align: right;
  }

  .description-cell {
    text-align: left;
  }

  /*
    LOWER AREA
  */

  .lower {
    display: flex;

    gap: 16px;

    width: 100%;

    min-width: 0;

    margin-bottom: 12px;

    align-items: flex-start;
  }

  .left {
    flex: 1 1 auto;

    min-width: 0;
  }

  /*
    AMOUNT IN WORDS
  */

  .amount-words {
    font-size: 11px;

    line-height: 1.4;

    margin-bottom: 10px;

    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /*
    BANK DETAILS
  */

  .bank-box {
    border: 1px solid #ccc;

    border-radius: 4px;

    padding: 8px;

    font-size: 11px;

    line-height: 1.4;

    overflow-wrap: anywhere;
    word-break: break-word;
  }

  /*
    TOTALS
  */

  .right-totals {
    width: 300px;

    min-width: 0;

    flex: 0 0 300px;
  }

  table.totals {
    width: 100%;

    border-collapse: collapse;

    font-size: 11px;

    font-family: "Times New Roman", Times, serif;

    table-layout: fixed;
  }

  table.totals td {
    padding: 4px 6px;

    border-bottom: 1px solid #eee;

    vertical-align: middle;

    overflow-wrap: anywhere;
    word-break: break-word;
  }

  table.totals td:first-child {
    width: 65%;
  }

  table.totals td:last-child {
    width: 35%;

    white-space: nowrap;
  }

  table.totals tr.grand td {
    font-weight: bold;

    border-top: 2px solid #0b5d3b;

    font-size: 13px;

    color: #0b5d3b;
  }

  /*
    TERMS
  */

  .terms {
    font-size: 10px;

    border: 1px solid #ccc;

    border-radius: 4px;

    padding: 8px 8px 8px 20px;

    margin-bottom: 0;

    line-height: 1.35;

    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .terms ol {
    margin: 4px 0 0 0;

    padding-left: 14px;
  }

  .terms li {
    margin-bottom: 2px;
  }

  /*
    STAMP + SIGNATURE
  */

  .stamp-sign-row {
    display: flex;

    justify-content: flex-end;

    align-items: flex-end;

    width: 100%;

    margin-top: 26px;
  }

  .signature {
    text-align: right;

    font-size: 11px;

    flex-shrink: 0;
  }

  .sign-space {
    height: 70px;

    border-bottom: 1px solid #999;

    width: 210px;

    margin-left: auto;
  }

  .sign-line {
    margin-top: 6px;
  }

  /*
    FOOTER SPACER
  */

  .spacer {
    flex: 1 1 auto;

    min-height: 10px;
  }

  /*
    FOOTER
  */

  .footer-bar {
    background: #0b5d3b;

    color: #fff;

    text-align: center;

    padding: 8px;

    font-size: 11px;

    border-radius: 4px;

    flex-shrink: 0;
  }

  /*
    PRINT SAFETY
  */

  @media print {

    html,
    body {
      width: 100%;
      margin: 0;
      padding: 0;
    }

    .page {
      width: 100%;
      max-width: none;
      margin: 0;
    }
  }

</style>

</head>

<body>

  ${pages}

</body>

</html>`;
}

module.exports = {
  buildInvoiceHtml,
  computeTotals,
};