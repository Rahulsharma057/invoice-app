const { amountInWords } = require("../utils/numberToWords");
const defaultLogo = require("../assets/defaultLogo");

function esc(v) {
  if (v === undefined || v === null) return "";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function money(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function computeTotals(invoice) {
  const itemsWithAmount = (invoice.items || []).map((it) => {
    const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);
    return { ...it, amount };
  });

  const totalBeforeTax = itemsWithAmount.reduce((s, it) => s + it.amount, 0);
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
//   customer -> Aadhar Number + PAN Number
//   dealer   -> Dealer Code + GSTIN
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
      <div class="box">
        <div class="box-title">${esc(title)}</div>
        <div><b>Name:</b> ${esc(party.name)}</div>
        ${idLine}
        <div><b>Address:</b> ${esc(party.address)}</div>
        ${taxLine}
        <div><b>Mobile:</b> ${esc(party.mobile)}</div>
      </div>`;
}

function renderCopy(invoice, copyLabel) {
  const t = computeTotals(invoice);
  const type = invoice.type === "dealer" ? "dealer" : "customer";

  const rows = t.itemsWithAmount
    .map(
      (it, idx) => `
      <tr>
        <td class="center">${idx + 1}</td>
        <td>${esc(it.description)}</td>
        <td class="center">${esc(it.size)}</td>
        <td class="center">${esc(it.hsnCode)}</td>
        <td class="center">${esc(it.qty)}</td>
        <td class="center">${esc(it.unit)}</td>
        <td class="right">${money(it.rate)}</td>
        <td class="right">Rs. ${money(it.amount)}</td>
      </tr>`
    )
    .join("");

  const termsList = (invoice.terms || [])
    .map((term) => `<li>${esc(term)}</li>`)
    .join("");

  const logoSrc = invoice.company?.logo || defaultLogo;

  return `
  <section class="page">
    <div class="copy-label">${esc(copyLabel)}</div>

    <div class="header">
      <div class="company">
        <img class="logo" src="${logoSrc}" alt="logo" />
        <div class="company-text">
          <div class="company-name">${esc(invoice.company?.name) || "COMPANY NAME"}</div>
          <div class="company-line">${esc(invoice.company?.address)}</div>
          <div class="company-line">
            ${invoice.company?.gstin ? `<b>GSTIN:</b> ${esc(invoice.company.gstin)} | ` : ""}
            ${invoice.company?.phone ? `<b>Ph.:</b> ${esc(invoice.company.phone)}` : ""}
          </div>
          <div class="company-line">
            ${invoice.company?.email ? `<b>Email:</b> ${esc(invoice.company.email)}` : ""}
            ${invoice.company?.website ? ` | ${esc(invoice.company.website)}` : ""}
          </div>
        </div>
      </div>
      <div class="invoice-badge">
        <div class="badge">INVOICE</div>
        <table class="meta">
          <tr><td>Invoice No.</td><td>${esc(invoice.invoiceNo)}</td></tr>
          <tr><td>Invoice Date</td><td>${esc(invoice.invoiceDate)}</td></tr>
          <tr><td>Place Supply</td><td>${esc(invoice.placeOfSupply)}</td></tr>
        </table>
      </div>
    </div>

    <div class="three-col">
      ${renderParty("BILL TO", invoice.billTo, type)}
      ${renderParty("SHIP TO", invoice.shipTo, type)}
      <div class="box">
        <div class="box-title">TRANSPORT DETAILS</div>
        <div><b>Transporter:</b> ${esc(invoice.transport?.transporter)}</div>
        <div><b>LR No.:</b> ${esc(invoice.transport?.lrNo)}</div>
        <div><b>LR Date:</b> ${esc(invoice.transport?.lrDate)}</div>
        <div><b>Vehicle No.:</b> ${esc(invoice.transport?.vehicleNo) || "-"}</div>
        <div><b>E-Way Bill:</b> ${esc(invoice.transport?.ewayBill) || "-"}</div>
      </div>
    </div>

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
        ${rows || `<tr><td colspan="8" class="center">No items</td></tr>`}
      </tbody>
    </table>

    <div class="lower">
      <div class="left">
        <div class="amount-words">
          <div><b>Amount Chargeable (in words):</b></div>
          <div>${amountInWords(t.grandTotal)}</div>
        </div>
        <div class="bank-box">
          <div class="box-title">BANK DETAILS</div>
          <div>Bank Name: <b>${esc(invoice.bank?.bankName)}</b></div>
          <div>A/c Name: <b>${esc(invoice.bank?.accountName)}</b></div>
          <div>A/c No.: <b>${esc(invoice.bank?.accountNo)}</b></div>
          <div>IFSC Code: <b>${esc(invoice.bank?.ifsc)}</b></div>
          <div>Branch: <b>${esc(invoice.bank?.branch)}</b></div>
        </div>
      </div>
      <div class="right-totals">
        <table class="totals">
          <tr><td>Total Amount Before Tax</td><td class="right">Rs. ${money(t.totalBeforeTax)}</td></tr>
          <tr><td>Discount</td><td class="right">${money(t.discount)}</td></tr>
          <tr><td>Taxable Amount</td><td class="right">Rs. ${money(t.taxable)}</td></tr>
          <tr><td>CGST (%)</td><td class="right">${t.cgstPercent}</td></tr>
          <tr><td>CGST Amount</td><td class="right">Rs. ${money(t.cgstAmount)}</td></tr>
          <tr><td>SGST (%)</td><td class="right">${t.sgstPercent}</td></tr>
          <tr><td>SGST Amount</td><td class="right">Rs. ${money(t.sgstAmount)}</td></tr>
          <tr><td>Round Off</td><td class="right">Rs. ${money(t.roundOff)}</td></tr>
          <tr class="grand"><td>Total Invoice Amount</td><td class="right">Rs. ${money(t.grandTotal)}</td></tr>
        </table>
      </div>
    </div>

    <div class="terms">
      <div class="box-title">Terms &amp; Conditions</div>
      <ol>${termsList}</ol>
    </div>

    <div class="stamp-sign-row">
      <div class="stamp-box">
        <div class="stamp-label">Company Seal / Mohar</div>
      </div>
      <div class="signature">
        <div class="sign-space"></div>
        <div class="sign-line">Authorized Signatory</div>
        <div><b>For ${esc(invoice.company?.name) || "COMPANY NAME"}</b></div>
      </div>
    </div>

    <div class="spacer"></div>
    <div class="footer-bar">Thank You For Your Business!</div>
  </section>`;
}

function buildInvoiceHtml(invoice) {
  const copies = ["ORIGINAL FOR BUYER", "DUPLICATE FOR TRANSPORTER", "TRIPLICATE FOR ASSESSEE"];
  const pages = copies.map((c) => renderCopy(invoice, c)).join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${esc(invoice.invoiceNo)}</title>
<style>
  * { box-sizing: border-box; }
  /* Font spec: Cambria for all data, except headings (Times New Roman) and totals box (Times New Roman) */
  html, body { font-family: Cambria, Georgia, serif; color: #222; margin: 0; }
  /*
    Page size is declared in real physical units (mm) via @page, and
    generatePdf.js renders with preferCSSPageSize so Chromium uses THIS
    size verbatim instead of silently scaling the layout to fit — that
    scaling is what previously made pixel-based height math unreliable.
    A4 = 210mm x 297mm, 10mm margin all round -> 190mm x 277mm content area.
  */
  @page { size: A4; margin: 10mm; }
  .page {
    width: 190mm;
    min-height: 277mm; /* fills the full printable content area */
    margin: 0 auto;
    padding: 8mm;
    page-break-after: always;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }
  .copy-label {
    position: absolute;
    top: 10px;
    right: 32px;
    font-size: 10px;
    font-weight: bold;
    color: #555;
    text-transform: uppercase;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0b5d3b; padding-bottom: 10px; margin-bottom: 12px; }
  .company { display: flex; gap: 12px; align-items: flex-start; }
  .logo { width: 64px; height: 64px; object-fit: contain; flex-shrink: 0; }
  .company-name { font-family: "Times New Roman", Times, serif; font-size: 22px; font-weight: bold; color: #0b5d3b; }
  .company-line { font-size: 11px; margin-top: 2px; }
  .invoice-badge { text-align: right; }
  .badge { font-family: "Times New Roman", Times, serif; background: #0b5d3b; color: #fff; font-weight: bold; font-size: 16px; padding: 6px 18px; border-radius: 4px; display: inline-block; margin-bottom: 6px; }
  .meta td { font-size: 11px; padding: 1px 4px; }
  .meta td:first-child { color: #555; text-align: right; padding-right: 8px; }
  .three-col { display: flex; gap: 10px; margin-bottom: 12px; }
  .box { flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 8px; font-size: 11px; }
  .box-title { font-weight: bold; color: #0b5d3b; border-bottom: 1px solid #ddd; margin-bottom: 6px; padding-bottom: 3px; font-size: 11px; text-transform: uppercase; }
  table.items { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 12px; }
  table.items th { background: #0b5d3b; color: #fff; padding: 6px; text-align: left; }
  table.items td { border: 1px solid #ddd; padding: 6px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .lower { display: flex; gap: 16px; margin-bottom: 12px; }
  .left { flex: 1; }
  .amount-words { font-size: 11px; margin-bottom: 10px; }
  .bank-box { border: 1px solid #ccc; border-radius: 4px; padding: 8px; font-size: 11px; }
  .right-totals { width: 300px; }
  table.totals { width: 100%; border-collapse: collapse; font-size: 11px; font-family: "Times New Roman", Times, serif; }
  table.totals td { padding: 4px 6px; border-bottom: 1px solid #eee; }
  table.totals tr.grand td { font-weight: bold; border-top: 2px solid #0b5d3b; font-size: 13px; color: #0b5d3b; }
  .terms { font-size: 10px; border: 1px solid #ccc; border-radius: 4px; padding: 8px 8px 8px 20px; margin-bottom: 0; }
  .terms ol { margin: 4px 0 0 0; padding-left: 14px; }

  /* Room to physically stamp (mohar) + sign the printed copy, sitting
     between Terms & Conditions and the footer bar. */
  .stamp-sign-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 26px; }
  .stamp-box { width: 150px; height: 90px; border: 1px dashed #bbb; border-radius: 4px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 6px; }
  .stamp-label { font-size: 9px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; }
  .signature { text-align: right; font-size: 11px; }
  .sign-space { height: 70px; border-bottom: 1px solid #999; width: 210px; margin-left: auto; }
  .sign-line { margin-top: 6px; }

  /* Pushes the footer bar all the way down within the fixed-height .page */
  .spacer { flex: 1 1 auto; min-height: 10px; }
  .footer-bar { background: #0b5d3b; color: #fff; text-align: center; padding: 8px; font-size: 11px; border-radius: 4px; flex-shrink: 0; }
</style>
</head>
<body>
  ${pages}
</body>
</html>`;
}

module.exports = { buildInvoiceHtml, computeTotals };
