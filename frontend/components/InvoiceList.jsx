"use client";
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useSnackbar } from "notistack";
import Link from "next/link";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Stack,
  CircularProgress,
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  TablePagination,
  Chip,
  Skeleton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleIcon from "@mui/icons-material/AddCircle";

import { getInvoices, downloadInvoicePdf, deleteInvoice } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "invoiceNo", label: "Invoice No." },
  { value: "amountHigh", label: "Amount: High to Low" },
  { value: "amountLow", label: "Amount: Low to High" },
];

export default function InvoiceList() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0); // MUI TablePagination is 0-based
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("newest");
  const [debouncedSearch] = useDebounce(search, 400);

  const params = useMemo(
    () => ({ page: page + 1, limit: rowsPerPage, search: debouncedSearch || undefined, type: type || undefined, sort }),
    [page, rowsPerPage, debouncedSearch, type, sort]
  );

  // Server-side pagination: each distinct (page, filters) combination gets
  // its own cache entry, so paging back to a page you already viewed is
  // instant and does not hit the network again until the cache goes stale
  // or an invoice is created/updated/deleted (which invalidates ["invoices"]).
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: queryKeys.invoices(params),
    queryFn: () => getInvoices(params),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      enqueueSnackbar("Invoice deleted", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (err) => enqueueSnackbar(`Delete failed: ${err.message}`, { variant: "error" }),
  });

  const handleDelete = (id) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    deleteMutation.mutate(id);
  };

  const handleDownload = async (inv) => {
    try {
      await downloadInvoicePdf(inv._id, inv.invoiceNo);
    } catch (err) {
      enqueueSnackbar(`Download failed: ${err.message}`, { variant: "error" });
    }
  };

  const invoices = data?.items || [];
  const total = data?.total || 0;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="h6" color="primary" sx={{ mr: "auto" }}>
          Saved Invoices {total ? <Chip size="small" label={total} sx={{ ml: 1 }} /> : null}
        </Typography>
        <Button component={Link} href="/" variant="contained" size="small" startIcon={<AddCircleIcon />}>
          New Invoice
        </Button>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by invoice no. or name"
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
          fullWidth
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField
          size="small"
          select
          label="Type"
          value={type}
          onChange={(e) => {
            setPage(0);
            setType(e.target.value);
          }}
          sx={{ minWidth: { xs: "100%", sm: 160 } }}
        >
          <MenuItem value="">All types</MenuItem>
          <MenuItem value="customer">Customer</MenuItem>
          <MenuItem value="dealer">Dealer</MenuItem>
        </TextField>
        <TextField
          size="small"
          select
          label="Sort"
          value={sort}
          onChange={(e) => {
            setPage(0);
            setSort(e.target.value);
          }}
          sx={{ minWidth: { xs: "100%", sm: 190 } }}
        >
          {SORT_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isLoading ? (
        <Stack spacing={1}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={44} />
          ))}
        </Stack>
      ) : isError ? (
        <Typography color="error">Failed to load invoices: {error.message}</Typography>
      ) : invoices.length === 0 ? (
        <Typography color="text.secondary">No invoices found.</Typography>
      ) : (
        <Box sx={{ overflowX: "auto", opacity: isFetching ? 0.6 : 1, transition: "opacity 0.15s" }}>
          <Table size="small" sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice No.</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Bill To</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv._id} hover>
                  <TableCell>{inv.invoiceNo}</TableCell>
                  <TableCell>{inv.invoiceDate}</TableCell>
                  <TableCell>
                    <Chip size="small" label={inv.type === "dealer" ? "Dealer" : "Customer"} color={inv.type === "dealer" ? "secondary" : "default"} variant="outlined" />
                  </TableCell>
                  <TableCell>{inv.billTo?.name}</TableCell>
                  <TableCell align="right">Rs. {(inv.grandTotal || 0).toLocaleString("en-IN")}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleDownload(inv)}>
                        PDF
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(inv._id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Paper>
  );
}
