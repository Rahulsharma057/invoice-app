"use client";
import { Tabs, Tab, Box, Paper, Typography } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import StoreIcon from "@mui/icons-material/Store";

const TYPES = [
  { value: "customer", label: "Customer Invoice", icon: <PersonIcon fontSize="small" />, hint: "For an individual buyer — captured with Aadhar Number + PAN Number." },
  { value: "dealer", label: "Dealer Invoice", icon: <StoreIcon fontSize="small" />, hint: "For a B2B dealer — captured with Dealer Code + GSTIN." },
];

export default function InvoiceTypeTabs({ value, onChange }) {
  const active = TYPES.find((t) => t.value === value) || TYPES[0];

  return (
    <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
      <Tabs
        value={value}
        onChange={(e, v) => onChange(v)}
        variant="fullWidth"
        textColor="primary"
        indicatorColor="primary"
        sx={{ bgcolor: "#f4f6f5" }}
      >
        {TYPES.map((t) => (
          <Tab key={t.value} value={t.value} icon={t.icon} iconPosition="start" label={t.label} sx={{ fontWeight: 600, minHeight: 52 }} />
        ))}
      </Tabs>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {active.hint}
        </Typography>
      </Box>
    </Paper>
  );
}
