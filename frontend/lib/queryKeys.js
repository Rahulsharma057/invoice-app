// Central place for react-query cache keys, so every component that reads
// or invalidates "invoices" / "config" agrees on the same key shape.
export const queryKeys = {
  invoices: (params) => ["invoices", params],
  invoice: (id) => ["invoice", id],
  config: () => ["config"],
  nextInvoiceNumber: (type) => ["next-invoice-number", type],
};
