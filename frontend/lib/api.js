import axios from "axios";

// Always talk to the same-origin /api path.
// next.config.js rewrites this to the real backend
// using BACKEND_URL environment variable.
const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.message ||
      "Something went wrong";

    return Promise.reject(
      new Error(message)
    );
  }
);

// =========================================================
// INVOICES
// =========================================================

export const createInvoice = (data) =>
  api
    .post("/invoices", data)
    .then((r) => r.data);

export const getInvoices = (params) =>
  api
    .get("/invoices", { params })
    .then((r) => r.data);

export const getInvoice = (id) =>
  api
    .get(`/invoices/${id}`)
    .then((r) => r.data);

export const updateInvoice = (id, data) =>
  api
    .put(`/invoices/${id}`, data)
    .then((r) => r.data);

export const deleteInvoice = (id) =>
  api
    .delete(`/invoices/${id}`)
    .then((r) => r.data);


// =========================================================
// INVOICE STATS
// IMPORTANT:
// This is completely independent of pagination/search.
// =========================================================

export const getInvoiceStats = () =>
  api
    .get("/invoices/stats")
    .then((r) => r.data);


// =========================================================
// INVOICE PDF
// =========================================================

export const downloadInvoicePdf = async (
  id,
  invoiceNo
) => {
  const res = await api.get(
    `/invoices/${id}/pdf`,
    {
      responseType: "blob",
    }
  );

  const url =
    window.URL.createObjectURL(
      new Blob([res.data], {
        type: "application/pdf",
      })
    );

  const link =
    document.createElement("a");

  link.href = url;

  link.setAttribute(
    "download",
    `Invoice-${invoiceNo}.pdf`
  );

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 10000);
};


// =========================================================
// PDF PREVIEW
// =========================================================

export const previewInvoicePdfUrl =
  async (data) => {
    const res = await api.post(
      "/invoices/preview/pdf",
      data,
      {
        responseType: "blob",
      }
    );

    return window.URL.createObjectURL(
      new Blob([res.data], {
        type: "application/pdf",
      })
    );
  };


// =========================================================
// CONFIG
// Company / Bank defaults / Tax / Numbering
// =========================================================

export const getConfig = () =>
  api
    .get("/config")
    .then((r) => r.data);

export const updateConfig = (data) =>
  api
    .put("/config", data)
    .then((r) => r.data);

export const getNextInvoiceNumber = (
  type
) =>
  api
    .get(
      "/config/next-invoice-number",
      {
        params: { type },
      }
    )
    .then((r) => r.data);


// =========================================================
// DEFAULT EXPORT
// =========================================================

export default api;