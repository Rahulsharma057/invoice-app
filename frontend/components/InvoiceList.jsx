"use client";

import React, { useMemo, useState } from "react";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

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
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  TablePagination,
  Chip,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import ClearIcon from "@mui/icons-material/Clear";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import { getInvoices, downloadInvoicePdf, deleteInvoice } from "../lib/api";

import { queryKeys } from "../lib/queryKeys";

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest first",
  },
  {
    value: "oldest",
    label: "Oldest first",
  },
  {
    value: "invoiceNo",
    label: "Invoice No.",
  },
  {
    value: "amountHigh",
    label: "Amount: High to Low",
  },
  {
    value: "amountLow",
    label: "Amount: Low to High",
  },
];

const BLUE = "#1976D2";
const BLUE_DARK = "#1565C0";
const BORDER = "#E1E8F0";

function formatAmount(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
const GREEN = "#0B5D3B";
const GREEN_DARK = "#084A30";
const GREEN_LIGHT = "#EAF5EF";

const TEXT = "#172033";
const TEXT_SECONDARY = "#667085";

export default function InvoiceList() {
  const { enqueueSnackbar } = useSnackbar();

  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [search, setSearch] = useState("");

  const [type, setType] = useState("");

  const [sort, setSort] = useState("newest");

  const [debouncedSearch] = useDebounce(search, 400);

  const params = useMemo(
    () => ({
      page: page + 1,
      limit: rowsPerPage,
      search: debouncedSearch || undefined,
      type: type || undefined,
      sort,
    }),
    [page, rowsPerPage, debouncedSearch, type, sort],
  );

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: queryKeys.invoices(params),
    queryFn: () => getInvoices(params),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,

    onSuccess: () => {
      enqueueSnackbar("Invoice deleted", {
        variant: "success",
      });

      queryClient.invalidateQueries({
        queryKey: ["invoices"],
      });

      queryClient.invalidateQueries({
        queryKey: ["invoice-stats"],
      });
    },

    onError: (err) => {
      enqueueSnackbar(`Delete failed: ${err.message}`, {
        variant: "error",
      });
    },
  });

  const handleDelete = (id) => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) {
      return;
    }

    deleteMutation.mutate(id);
  };

  const handleEdit = (id) => {
    window.location.href = `/?edit=${encodeURIComponent(id)}`;
  };

  const handleDownload = async (invoice) => {
    try {
      await downloadInvoicePdf(invoice._id, invoice.invoiceNo);
    } catch (err) {
      enqueueSnackbar(`Download failed: ${err.message}`, {
        variant: "error",
      });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setType("");
    setSort("newest");
    setPage(0);
  };

  const invoices = data?.items || [];

  const total = data?.total || 0;

  const hasFilters = Boolean(search || type || sort !== "newest");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#F6F9FC",
  /*       px: {
          xs: 1,
          sm: 1.5,
          md: 2,
        },
        py: {
          xs: 1,
          sm: 1.5,
          md: 2,
        }, */
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${BORDER}`,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 1.25, sm: 1.5 },
              borderBottom: `1px solid ${BORDER}`,
              background: "#FFFFFF",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                width: "100%",
              }}
            >
              {/* LEFT — Saved Invoices */}
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    minWidth: 38,
                    borderRadius: 1.75,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: GREEN_LIGHT,
                    color: GREEN,
                    border: "1px solid rgba(11,93,59,0.10)",
                  }}
                >
                  <ReceiptLongIcon fontSize="small" />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: { xs: 15, sm: 16 },
                      fontWeight: 800,
                      lineHeight: 1.25,
                      color: TEXT,
                    }}
                  >
                    Saved Invoices
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.3,
                      color: TEXT_SECONDARY,
                      fontSize: 11.5,
                    }}
                  >
                    {total} invoice{total === 1 ? "" : "s"}
                  </Typography>
                </Box>
              </Stack>

              {/* RIGHT — New Invoice */}
              <Button
                component={Link}
                href="/"
                variant="contained"
                size="small"
                startIcon={<AddCircleIcon />}
                sx={{
                  flexShrink: 0,
                  minHeight: 36,
                  px: 1.75,
                  borderRadius: 1.5,
                  fontWeight: 800,
                  fontSize: 12.5,
                  textTransform: "none",
                  background: GREEN,
                  color: "#FFFFFF",
                  boxShadow: "none",

                  "&:hover": {
                    background: GREEN_DARK,
                    boxShadow: "0 4px 12px rgba(11,93,59,0.18)",
                  },
                }}
              >
                New Invoice
              </Button>
            </Stack>
          </Box>

          {/* FILTERS */}
          <Box
            sx={{
              px: {
                xs: 1.25,
                sm: 1.75,
              },
              py: 1.25,
              background: "#FBFCFE",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={1}
              alignItems={{
                xs: "stretch",
                md: "center",
              }}
            >
              <TextField
                size="small"
                placeholder="Search invoice no. or name"
                value={search}
                onChange={(e) => {
                  setPage(0);
                  setSearch(e.target.value);
                }}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    background: "#fff",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
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
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 145,
                  },
                  "& .MuiOutlinedInput-root": {
                    background: "#fff",
                  },
                }}
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
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 175,
                  },
                  "& .MuiOutlinedInput-root": {
                    background: "#fff",
                  },
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              {hasFilters ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  sx={{
                    minHeight: 40,
                    whiteSpace: "nowrap",
                    borderColor: "#CBD5E1",
                    color: "#475569",
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </Stack>
          </Box>

          {/* CONTENT */}
          {isLoading ? (
            <Stack spacing={0.75} sx={{ p: 1.25 }}>
              {[1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} variant="rounded" height={40} />
              ))}
            </Stack>
          ) : isError ? (
            <Box sx={{ p: 2 }}>
              <Typography color="error" fontSize={14}>
                Failed to load invoices: {error?.message || "Unknown error"}
              </Typography>
            </Box>
          ) : invoices.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
              }}
            >
              <ReceiptLongIcon
                sx={{
                  fontSize: 42,
                  color: "#B8C2CC",
                  mb: 1,
                }}
              />

              <Typography color="text.secondary" fontSize={14}>
                No invoices found.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                overflowX: "auto",
                opacity: isFetching ? 0.55 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 760,

                  "& .MuiTableCell-root": {
                    px: 1.25,
                    py: 0.85,
                    fontSize: 12.5,
                    borderBottom: "1px solid #EDF1F5",
                  },

                  "& .MuiTableHead-root .MuiTableCell-root": {
                    background: "#F7F9FC",
                    color: "#667085",
                    fontWeight: 800,
                    fontSize: 11.5,
                    textTransform: "uppercase",
                    letterSpacing: 0.25,
                    py: 1,
                  },

                  "& .MuiTableBody-root .MuiTableRow-root:hover": {
                    background: "#F8FBFF",
                  },
                }}
              >
                <TableHead
                  sx={{
                    backgroundColor: "#0B5D3B !important",
                  }}
                >
                  <TableRow
                    sx={{
                      backgroundColor: "#0B5D3B !important",

                      "& > .MuiTableCell-root": {
                        backgroundColor: "#0B5D3B !important",
                        color: "#FFFFFF !important",
                        fontWeight: 800,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        borderBottom: "none !important",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        backgroundColor: "#0B5D3B !important",
                        color: "#FFFFFF !important",
                      }}
                    >
                      Invoice
                    </TableCell>

                    <TableCell
                      sx={{
                        backgroundColor: "#0B5D3B !important",
                        color: "#FFFFFF !important",
                      }}
                    >
                      Date
                    </TableCell>

                    <TableCell
                      sx={{
                        backgroundColor: "#0B5D3B !important",
                        color: "#FFFFFF !important",
                      }}
                    >
                      Type
                    </TableCell>

                    <TableCell
                      sx={{
                        backgroundColor: "#0B5D3B !important",
                        color: "#FFFFFF !important",
                      }}
                    >
                      Bill To
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        backgroundColor: "#0B5D3B !important",
                        color: "#FFFFFF !important",
                      }}
                    >
                      Amount
                    </TableCell>

                 <TableCell
  sx={{
    backgroundColor: "#0B5D3B !important",
    color: "#FFFFFF !important",
    textAlign: "center !important",
    transform: "translateX(25px)",
  }}
>
  Actions
</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            color: BLUE_DARK,
                          }}
                        >
                          {invoice.invoiceNo}
                        </Typography>
                      </TableCell>

                      <TableCell
                        sx={{
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(invoice.invoiceDate || invoice.createdAt)}
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            invoice.type === "dealer" ? "Dealer" : "Customer"
                          }
                          sx={{
                            height: 23,
                            fontSize: 10.5,
                            fontWeight: 700,
                            background:
                              invoice.type === "dealer" ? "#F3E5F5" : "#E8F5E9",
                            color:
                              invoice.type === "dealer" ? "#7B1FA2" : "#2E7D32",
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            maxWidth: 230,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {invoice.billTo?.name || "-"}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            color: "#172033",
                          }}
                        >
                          {formatAmount(invoice.grandTotal)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={0.25}
                          justifyContent="flex-end"
                        >
                          <Tooltip title="Edit invoice">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(invoice._id)}
                              sx={{
                                width: 30,
                                height: 30,
                                color: BLUE,
                              }}
                            >
                              <EditIcon
                                sx={{
                                  fontSize: 17,
                                }}
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(invoice)}
                              sx={{
                                width: 30,
                                height: 30,
                                color: "#475569",
                              }}
                            >
                              <DownloadIcon
                                sx={{
                                  fontSize: 17,
                                }}
                              />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete invoice">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(invoice._id)}
                              disabled={deleteMutation.isPending}
                              sx={{
                                width: 30,
                                height: 30,
                                color: "#D32F2F",
                              }}
                            >
                              <DeleteIcon
                                sx={{
                                  fontSize: 17,
                                }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* PAGINATION */}
          <Box
            sx={{
              borderTop: `1px solid ${BORDER}`,
              background: "#FBFCFE",
            }}
          >
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_event, newPage) => {
                setPage(newPage);
              }}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{
                "& .MuiTablePagination-toolbar": {
                  minHeight: 48,
                  px: 1,
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                  {
                    fontSize: 12,
                  },
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
