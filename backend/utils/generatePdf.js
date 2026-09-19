const puppeteer = require("puppeteer");
const { buildInvoiceHtml } = require("../templates/invoiceTemplate");

// Launching a fresh Chromium process per PDF request is slow (1-2s+ of pure
// startup overhead) and doesn't scale in production. We keep one shared
// browser instance alive for the lifetime of the server and hand out a new
// *page* (tab) per request instead, which is fast and still fully isolated.
let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      })
      .catch((err) => {
        browserPromise = null; // allow retry on next call
        throw err;
      });
  }
  const browser = await browserPromise;

  // If the browser process died (e.g. OOM), relaunch it on next use.
  browser.once("disconnected", () => {
    browserPromise = null;
  });

  return browser;
}

async function generateInvoicePdfBuffer(invoice) {
  const html = buildInvoiceHtml(invoice);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      printBackground: true,
      // The template defines its own @page { size: A4; margin: 10mm } rule
      // (see templates/invoiceTemplate.js) — preferCSSPageSize makes Chromium
      // honour that exactly instead of silently rescaling the layout to fit,
      // which is what previously threw off pixel-based height calculations
      // (e.g. the footer not sitting flush at the bottom of the page).
      preferCSSPageSize: true,
    });
    return pdfBuffer;
  } finally {
    await page.close();
  }
}

async function shutdownPdfEngine() {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    if (browser) await browser.close();
    browserPromise = null;
  }
}

module.exports = { generateInvoicePdfBuffer, shutdownPdfEngine };
