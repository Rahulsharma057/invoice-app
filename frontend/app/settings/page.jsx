"use client";
import { Typography, Box } from "@mui/material";
import SettingsForm from "../../components/SettingsForm";

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h4" color="primary" fontWeight={700} gutterBottom sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
        Configuration
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        These defaults (company, bank, tax %, terms, invoice numbering) are used to pre-fill every new invoice, so you
        don&apos;t have to retype them each time.
      </Typography>
      <SettingsForm />
    </Box>
  );
}
