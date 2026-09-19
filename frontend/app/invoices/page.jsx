"use client";
import { Typography, Box } from "@mui/material";
import InvoiceList from "../../components/InvoiceList";

export default function InvoicesPage() {
  return (
    <Box>
      <Typography variant="h4" color="primary" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
        Saved Invoices
      </Typography>
      <InvoiceList />
    </Box>
  );
}
