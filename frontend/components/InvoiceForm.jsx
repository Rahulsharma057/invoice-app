"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import {
  Paper,
  Typography,
  Grid,
  Button,
  Checkbox,
  FormControlLabel,
  Avatar,
  Stack,
  Box,
  TextField,
  Skeleton,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { SectionCard, Field } from "./FormUI";
import PartyFields from "./PartyFields";
import InvoiceTypeTabs from "./InvoiceTypeTabs";
import ItemsTable from "./ItemsTable";
import PreviewDialog from "./PreviewDialog";
import { createInvoice, downloadInvoicePdf, previewInvoicePdfUrl, getConfig, getNextInvoiceNumber } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

const emptyParty = () => ({ name: "", address: "", mobile: "", aadhar: "", pan: "", gstin: "", dealerCode: "" });
const emptyItem = () => ({ description: "", size: "", hsnCode: "", qty: 1, unit: "Pcs.", rate: 0 });

function buildInitialForm(config, invoiceNo, type) {
  return {
    type,
    invoiceNo: invoiceNo || "",
    invoiceDate: new Date().toISOString().slice(0, 10),
    placeOfSupply: config?.defaults?.placeOfSupply || "UTTAR PRADESH",
    company: {
      name: config?.company?.name || "",
      address: config?.company?.address || "",
      gstin: config?.company?.gstin || "",
      phone: config?.company?.phone || "",
      email: config?.company?.email || "",
      website: config?.company?.website || "",
      logo: config?.company?.logo || "",
    },
    billTo: emptyParty(),
    shipTo: emptyParty(),
    transport: { transporter: "", lrNo: "", lrDate: "", vehicleNo: "", ewayBill: "" },
    items: [emptyItem()],
    discount: 0,
    cgstPercent: config?.defaults?.cgstPercent ?? 9,
    sgstPercent: config?.defaults?.sgstPercent ?? 9,
    bank: {
      bankName: config?.bank?.bankName || "",
      accountName: config?.bank?.accountName || "",
      accountNo: config?.bank?.accountNo || "",
      ifsc: config?.bank?.ifsc || "",
      branch: config?.bank?.branch || "",
    },
    terms: config?.defaults?.terms?.length ? [...config.defaults.terms] : [""],
  };
}

export default function InvoiceForm() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [type, setType] = useState("customer");
  const [form, setForm] = useState(null);
  const [copySame, setCopySame] = useState(true);
  const [invoiceNoTouched, setInvoiceNoTouched] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Company/bank/terms defaults — fetched once and cached (see Providers'
  // staleTime), so switching tabs or coming back to this page later doesn't
  // hit the network again unless Settings were actually changed.
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.config(),
    queryFn: getConfig,
  });

  // Suggested next invoice number for the currently selected type. Cached
  // per-type so flipping between Customer/Dealer tabs is instant on repeat visits.
  const { data: nextNumberData } = useQuery({
    queryKey: queryKeys.nextInvoiceNumber(type),
    queryFn: () => getNextInvoiceNumber(type),
    enabled: !!config,
  });

  // Initialise the form once config has loaded.
  useEffect(() => {
    if (config && !form) {
      setForm(buildInitialForm(config, nextNumberData?.invoiceNo, type));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // When the suggested number arrives (or type changes) fill it in, but only
  // if the user hasn't manually typed their own invoice number.
  useEffect(() => {
    if (form && nextNumberData?.invoiceNo && !invoiceNoTouched) {
      setForm((f) => (f ? { ...f, invoiceNo: nextNumberData.invoiceNo } : f));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextNumberData]);

  const handleTypeChange = (newType) => {
    setType(newType);
    setInvoiceNoTouched(false);
    setForm((f) => (f ? { ...f, type: newType } : f));
  };

  const setNested = (section, field, value) => setForm((f) => ({ ...f, [section]: { ...f[section], [field]: value } }));

  const handleCopySameToggle = (checked) => {
    setCopySame(checked);
    if (checked) setForm((f) => ({ ...f, shipTo: { ...f.billTo } }));
  };

  const setBillToField = (field, value) => {
    setForm((f) => {
      const nextBillTo = { ...f.billTo, [field]: value };
      return { ...f, billTo: nextBillTo, shipTo: copySame ? { ...nextBillTo } : f.shipTo };
    });
  };

  const setShipToField = (field, value) => setNested("shipTo", field, value);

  const setItems = (items) => setForm((f) => ({ ...f, items }));

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

  const effectiveLogo = () => form?.company?.logo || "/logo.jpg";

  // ---- Mutations ----
  const saveMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: async (saved) => {
      enqueueSnackbar(`Invoice ${saved.invoiceNo} saved`, { variant: "success" });
      // Invalidate the cached list + next-number so both reflect the new record.
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.nextInvoiceNumber(type) });
      try {
        await downloadInvoicePdf(saved._id, saved.invoiceNo);
      } catch {
        enqueueSnackbar("Saved, but PDF download failed — try downloading from Saved Invoices.", { variant: "warning" });
      }
      // Reset the form for the next invoice, keeping the same type + defaults.
      setInvoiceNoTouched(false);
      setForm(buildInitialForm(config, undefined, type));
    },
    onError: (err) => enqueueSnackbar(`Error saving invoice: ${err.message}`, { variant: "error" }),
  });

  const previewMutation = useMutation({
    mutationFn: previewInvoicePdfUrl,
    onSuccess: (url) => setPreviewUrl(url),
    onError: (err) => enqueueSnackbar(`Error generating preview: ${err.message}`, { variant: "error" }),
  });

  const handlePreview = () => {
    setPreviewOpen(true);
    previewMutation.mutate(form);
  };

  const handleReset = () => {
    if (!window.confirm("Clear the form and start over?")) return;
    setInvoiceNoTouched(false);
    setForm(buildInitialForm(config, nextNumberData?.invoiceNo, type));
  };

  const totalPreview = useMemo(() => {
    if (!form) return 0;
    const totalBeforeTax = form.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
    return totalBeforeTax;
  }, [form]);

  if (configLoading || !form) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={56} />
        <Skeleton variant="rounded" height={140} />
        <Skeleton variant="rounded" height={200} />
        <Skeleton variant="rounded" height={200} />
      </Stack>
    );
  }

  return (
    <Box>
      <InvoiceTypeTabs value={type} onChange={handleTypeChange} />

      <SectionCard title="Invoice Details">
        <Field
          label="Invoice No."
          value={form.invoiceNo}
          onChange={(e) => {
            setInvoiceNoTouched(true);
            setForm({ ...form, invoiceNo: e.target.value });
          }}
          placeholder="SRF/26-27/12"
          required
        />
        <Field
          label="Invoice Date"
          type="date"
          value={form.invoiceDate}
          onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
          required
        />
        <Field label="Place of Supply" value={form.placeOfSupply} onChange={(e) => setForm({ ...form, placeOfSupply: e.target.value })} />
      </SectionCard>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Company (Seller) Details
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
          <Avatar src={effectiveLogo()} variant="rounded" sx={{ width: 56, height: 56 }} />
          <Button component="label" variant="outlined" startIcon={<UploadIcon />} size="small">
            Upload Logo
            <input type="file" accept="image/*" hidden onChange={handleLogoUpload} />
          </Button>
          <Typography variant="caption" color="text.secondary">
            PDF header me yahi logo print hoga. Default logo Settings me set hota hai.
          </Typography>
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

      <SectionCard title="Bill To">
        <PartyFields type={type} party={form.billTo} onChange={setBillToField} />
      </SectionCard>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <FormControlLabel
          control={<Checkbox checked={copySame} onChange={(e) => handleCopySameToggle(e.target.checked)} />}
          label="Ship To same as Bill To"
        />
        {!copySame && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <PartyFields type={type} party={form.shipTo} onChange={setShipToField} />
          </Grid>
        )}
      </Paper>

      <SectionCard title="Transport Details">
        <Field label="Transporter" value={form.transport.transporter} onChange={(e) => setNested("transport", "transporter", e.target.value)} />
        <Field label="LR No." value={form.transport.lrNo} onChange={(e) => setNested("transport", "lrNo", e.target.value)} />
        <Field label="LR Date" type="date" value={form.transport.lrDate} onChange={(e) => setNested("transport", "lrDate", e.target.value)} />
        <Field label="Vehicle No." value={form.transport.vehicleNo} onChange={(e) => setNested("transport", "vehicleNo", e.target.value)} />
        <Field label="E-Way Bill" value={form.transport.ewayBill} onChange={(e) => setNested("transport", "ewayBill", e.target.value)} />
      </SectionCard>

      <ItemsTable items={form.items} setItems={setItems} />

      <SectionCard title="Tax & Discount">
        <Field label="Discount (Rs.)" type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} />
        <Field label="CGST %" type="number" value={form.cgstPercent} onChange={(e) => setForm({ ...form, cgstPercent: Number(e.target.value) })} />
        <Field label="SGST %" type="number" value={form.sgstPercent} onChange={(e) => setForm({ ...form, sgstPercent: Number(e.target.value) })} />
      </SectionCard>

      <SectionCard title="Bank Details">
        <Field label="Bank Name" value={form.bank.bankName} onChange={(e) => setNested("bank", "bankName", e.target.value)} />
        <Field label="Account Name" value={form.bank.accountName} onChange={(e) => setNested("bank", "accountName", e.target.value)} />
        <Field label="Account No." value={form.bank.accountNo} onChange={(e) => setNested("bank", "accountNo", e.target.value)} />
        <Field label="IFSC Code" value={form.bank.ifsc} onChange={(e) => setNested("bank", "ifsc", e.target.value)} />
        <Field label="Branch" value={form.bank.branch} onChange={(e) => setNested("bank", "branch", e.target.value)} />
      </SectionCard>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
        <Typography variant="h6" color="primary" gutterBottom>
          Terms &amp; Conditions (one per line)
        </Typography>
        <TextField
          multiline
          minRows={4}
          fullWidth
          value={form.terms.join("\n")}
          onChange={(e) => setForm({ ...form, terms: e.target.value.split("\n") })}
        />
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          position: "sticky",
          bottom: 0,
          bgcolor: "#fff",
          zIndex: 2,
          boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
            Items total (before tax): <b>Rs. {totalPreview.toFixed(2)}</b>
          </Typography>
          <Button variant="text" color="inherit" startIcon={<RestartAltIcon />} onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handlePreview}>
            Preview
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save & Download"}
          </Button>
        </Stack>
      </Paper>

      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} previewUrl={previewUrl} loading={previewMutation.isPending} />
    </Box>
  );
}
