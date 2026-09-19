"use client";
import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { Box, Paper, Typography, Stack, Button, TextField, Avatar, Grid, Skeleton, Divider } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";

import { SectionCard, Field } from "./FormUI";
import { getConfig, updateConfig } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

export default function SettingsForm() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({ queryKey: queryKeys.config(), queryFn: getConfig });
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (config && !form) setForm(JSON.parse(JSON.stringify(config)));
  }, [config, form]);

  const saveMutation = useMutation({
    mutationFn: updateConfig,
    onSuccess: (saved) => {
      enqueueSnackbar("Settings saved", { variant: "success" });
      queryClient.setQueryData(queryKeys.config(), saved);
      // Numbering may have changed, so drop any cached "next number" previews.
      queryClient.invalidateQueries({ queryKey: ["next-invoice-number"] });
    },
    onError: (err) => enqueueSnackbar(`Save failed: ${err.message}`, { variant: "error" }),
  });

  const setNested = (section, field, value) => setForm((f) => ({ ...f, [section]: { ...f[section], [field]: value } }));
  const setNumbering = (type, field, value) =>
    setForm((f) => ({ ...f, numbering: { ...f.numbering, [type]: { ...f.numbering[type], [field]: value } } }));

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      enqueueSnackbar("Logo image should be under 2MB", { variant: "warning" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setNested("company", "logo", reader.result);
    reader.readAsDataURL(file);
  };

  if (isLoading || !form) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={140} />
      </Stack>
    );
  }

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Default Company (Seller) Details
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
          <Avatar src={form.company.logo || "/logo.jpg"} variant="rounded" sx={{ width: 56, height: 56 }} />
          <Button component="label" variant="outlined" startIcon={<UploadIcon />} size="small">
            Upload Default Logo
            <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
          </Button>
        </Stack>
        <Grid container spacing={2}>
          <Field label="Company Name" value={form.company.name} onChange={(e) => setNested("company", "name", e.target.value)} md={6} />
          <Field label="GSTIN" value={form.company.gstin} onChange={(e) => setNested("company", "gstin", e.target.value)} md={6} />
          <Field label="Address" value={form.company.address} onChange={(e) => setNested("company", "address", e.target.value)} md={12} />
          <Field label="Phone" value={form.company.phone} onChange={(e) => setNested("company", "phone", e.target.value)} />
          <Field label="Email" value={form.company.email} onChange={(e) => setNested("company", "email", e.target.value)} />
          <Field label="Website" value={form.company.website} onChange={(e) => setNested("company", "website", e.target.value)} />
        </Grid>
      </Paper>

      <SectionCard title="Default Bank Details">
        <Field label="Bank Name" value={form.bank.bankName} onChange={(e) => setNested("bank", "bankName", e.target.value)} />
        <Field label="Account Name" value={form.bank.accountName} onChange={(e) => setNested("bank", "accountName", e.target.value)} />
        <Field label="Account No." value={form.bank.accountNo} onChange={(e) => setNested("bank", "accountNo", e.target.value)} />
        <Field label="IFSC Code" value={form.bank.ifsc} onChange={(e) => setNested("bank", "ifsc", e.target.value)} />
        <Field label="Branch" value={form.bank.branch} onChange={(e) => setNested("bank", "branch", e.target.value)} />
      </SectionCard>

      <SectionCard title="Default Tax & Place of Supply">
        <Field label="Place of Supply" value={form.defaults.placeOfSupply} onChange={(e) => setNested("defaults", "placeOfSupply", e.target.value)} />
        <Field
          label="CGST %"
          type="number"
          value={form.defaults.cgstPercent}
          onChange={(e) => setNested("defaults", "cgstPercent", Number(e.target.value))}
        />
        <Field
          label="SGST %"
          type="number"
          value={form.defaults.sgstPercent}
          onChange={(e) => setNested("defaults", "sgstPercent", Number(e.target.value))}
        />
      </SectionCard>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Default Terms &amp; Conditions (one per line)
        </Typography>
        <TextField
          multiline
          minRows={4}
          fullWidth
          value={form.defaults.terms.join("\n")}
          onChange={(e) => setNested("defaults", "terms", e.target.value.split("\n"))}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Invoice Numbering
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          Prefix + running number suggested automatically on the New Invoice form for each invoice type. You can always
          override the suggested number by hand while creating an invoice.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Customer Invoices
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Prefix"
                value={form.numbering.customer.prefix}
                onChange={(e) => setNumbering("customer", "prefix", e.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Next Number"
                type="number"
                value={form.numbering.customer.nextSeq}
                onChange={(e) => setNumbering("customer", "nextSeq", Number(e.target.value))}
                fullWidth
              />
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Dealer Invoices
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Prefix"
                value={form.numbering.dealer.prefix}
                onChange={(e) => setNumbering("dealer", "prefix", e.target.value)}
                fullWidth
              />
              <TextField
                size="small"
                label="Next Number"
                type="number"
                value={form.numbering.dealer.nextSeq}
                onChange={(e) => setNumbering("dealer", "nextSeq", Number(e.target.value))}
                fullWidth
              />
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </Stack>
    </Box>
  );
}
