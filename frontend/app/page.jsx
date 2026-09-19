"use client";
import { Typography, Box } from "@mui/material";
import InvoiceForm from "../components/InvoiceForm";

export default function HomePage() {
  return (
    <Box>
      <Typography variant="h4" color="primary" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
        New Invoice
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Choose the invoice type below, fill the form, then preview or save to generate the GST invoice
        (Original / Duplicate / Triplicate copies in one PDF).
      </Typography>
      <InvoiceForm />
    </Box>
  );
}
