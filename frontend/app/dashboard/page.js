
"use client";

import React from "react";
import Link from "next/link";

import {
  Box,
  Paper,
  Typography,
  Grid,
  Stack,
  Button,
  Skeleton,
  Alert,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useQuery } from "@tanstack/react-query";

import { getInvoiceStats, getInvoices } from "../../lib/api";

/* =========================================================
   SAMRADDHI THEME
========================================================= */

const GREEN = "#0B5D3B";
const GREEN_DARK = "#084A30";
const GREEN_LIGHT = "#EAF5EF";

const GOLD = "#D9B676";
const GOLD_DARK = "#B8954F";
const GOLD_LIGHT = "#FBF6EA";

const TEXT = "#172033";
const TEXT_SECONDARY = "#667085";

const BORDER = "#E5E9E7";
const PAGE_BG = "#F7F9F8";

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = GREEN,
  iconBackground = GREEN_LIGHT,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        p: {
          xs: 1.75,
          sm: 2,
        },

        borderRadius: 2.5,

        border: `1px solid ${BORDER}`,

        background: "#fff",

        position: "relative",
        overflow: "hidden",

        transition: "all 0.2s ease",

        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(11,93,59,0.08)",
          borderColor: "rgba(11,93,59,0.18)",
        },
      }}
    >
      {/* LEFT ACCENT */}
      <Box
        sx={{
          position: "absolute",

          top: 0,
          left: 0,

          width: 4,
          height: "100%",

          background: accent,
        }}
      />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: TEXT_SECONDARY,
              fontWeight: 600,
              mb: 0.6,
              fontSize: 13,
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: TEXT,
              lineHeight: 1.2,
              wordBreak: "break-word",
            }}
          >
            {value}
          </Typography>

          {subtitle ? (
            <Typography
              variant="caption"
              sx={{
                color: TEXT_SECONDARY,
                display: "block",
                mt: 0.6,
                fontSize: 11.5,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        {/* ICON */}
        <Box
          sx={{
            width: 44,
            height: 44,
            minWidth: 44,

            borderRadius: 2,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            background: iconBackground,
            color: accent,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}

/* =========================================================
   FORMAT AMOUNT
========================================================= */

function formatAmount(value) {
  const amount = Number(value) || 0;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/* =========================================================
   FORMAT DATE
========================================================= */

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

/* =========================================================
   DASHBOARD
========================================================= */

export default function DashboardPage() {
  /* =======================================================
     STATS
  ======================================================= */

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["invoice-stats"],
    queryFn: getInvoiceStats,
    staleTime: 30000,
  });

  /* =======================================================
     RECENT INVOICES
  ======================================================= */

  const {
    data: recentData,
    isLoading: recentLoading,
  } = useQuery({
    queryKey: ["dashboard-recent-invoices"],

    queryFn: () =>
      getInvoices({
        page: 1,
        limit: 5,
        sort: "newest",
      }),

    staleTime: 30000,
  });

  const recentInvoices = recentData?.items || [];

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",

        background: PAGE_BG,

        px: {
          xs: 1.25,
          sm: 2,
          md: 3,
        },

        py: {
          xs: 1.5,
          sm: 2,
          md: 2.5,
        },
      }}
    >
      <Box
        sx={{
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Paper
          elevation={0}
          sx={{
            mb: 2,

            p: {
              xs: 1.75,
              sm: 2.25,
              md: 2.5,
            },

            borderRadius: 2.5,

            border: `1px solid ${GREEN}`,

            background: `linear-gradient(
              135deg,
              ${GREEN_DARK} 0%,
              ${GREEN} 65%,
              #116C48 100%
            )`,

            color: "#fff",

            overflow: "hidden",

            position: "relative",
          }}
        >
          {/* DECORATIVE CIRCLE */}
          <Box
            sx={{
              position: "absolute",

              width: 160,
              height: 160,

              borderRadius: "50%",

              right: -70,
              top: -90,

              background: "rgba(217,182,118,0.12)",
            }}
          />

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            sx={{
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* TITLE */}
            <Stack
              direction="row"
              spacing={1.25}
              alignItems="center"
              sx={{
                flex: 1,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,

                  borderRadius: 2,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  background: "rgba(255,255,255,0.12)",

                  border: "1px solid rgba(217,182,118,0.45)",

                  color: GOLD,
                }}
              >
                <DashboardIcon />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    lineHeight: 1.2,

                    fontSize: {
                      xs: "1.05rem",
                      sm: "1.15rem",
                    },
                  }}
                >
                  Invoice Dashboard
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    opacity: 0.78,
                    mt: 0.35,
                    fontSize: 12.5,
                  }}
                >
                  Overview of your invoices and billing activity
                </Typography>
              </Box>
            </Stack>

            {/* ACTION BUTTONS */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
            >
              <Button
                component={Link}
                href="/"
                variant="contained"
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                sx={{
                  background: GOLD,
                  color: GREEN_DARK,

                  fontWeight: 800,

                  borderRadius: 1.5,

                  px: 1.75,

                  boxShadow: "none",

                  "&:hover": {
                    background: GOLD_DARK,
                    boxShadow: "none",
                  },
                }}
              >
                New Invoice
              </Button>

              <Button
                component={Link}
                href="/invoices"
                variant="outlined"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  color: "#fff",

                  borderColor: "rgba(255,255,255,0.40)",

                  fontWeight: 700,

                  borderRadius: 1.5,

                  px: 1.5,

                  "&:hover": {
                    borderColor: GOLD,
                    color: GOLD,
                    background: "rgba(217,182,118,0.08)",
                  },
                }}
              >
                View Invoices
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* =================================================
            ERROR
        ================================================= */}

        {statsError ? (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            Failed to load invoice dashboard.
          </Alert>
        ) : null}

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <Grid
          container
          spacing={1.5}
          sx={{
            mb: 2,
          }}
        >
          {/* TOTAL */}
          <Grid item xs={12} sm={6} lg={3}>
            {statsLoading ? (
              <Skeleton
                variant="rounded"
                height={122}
              />
            ) : (
              <StatCard
                title="Total Invoices"
                value={stats?.totalInvoices || 0}
                subtitle="All invoices"
                icon={<ReceiptLongIcon />}
                accent={GREEN}
                iconBackground={GREEN_LIGHT}
              />
            )}
          </Grid>

          {/* CUSTOMER */}
          <Grid item xs={12} sm={6} lg={3}>
            {statsLoading ? (
              <Skeleton
                variant="rounded"
                height={122}
              />
            ) : (
              <StatCard
                title="Customer Invoices"
                value={stats?.customerInvoices || 0}
                subtitle="Customer billing"
                icon={<PersonIcon />}
                accent="#2E7D32"
                iconBackground="#EAF5EC"
              />
            )}
          </Grid>

          {/* DEALER */}
          <Grid item xs={12} sm={6} lg={3}>
            {statsLoading ? (
              <Skeleton
                variant="rounded"
                height={122}
              />
            ) : (
              <StatCard
                title="Dealer Invoices"
                value={stats?.dealerInvoices || 0}
                subtitle="Dealer billing"
                icon={<BusinessIcon />}
                accent={GOLD_DARK}
                iconBackground={GOLD_LIGHT}
              />
            )}
          </Grid>

          {/* TOTAL AMOUNT */}
          <Grid item xs={12} sm={6} lg={3}>
            {statsLoading ? (
              <Skeleton
                variant="rounded"
                height={122}
              />
            ) : (
              <StatCard
                title="Total Amount"
                value={formatAmount(stats?.totalAmount)}
                subtitle="Grand total of all invoices"
                icon={<CurrencyRupeeIcon />}
                accent="#A67C28"
                iconBackground={GOLD_LIGHT}
              />
            )}
          </Grid>
        </Grid>

        {/* =================================================
            RECENT INVOICES
        ================================================= */}

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2.5,

            border: `1px solid ${BORDER}`,

            background: "#fff",

            overflow: "hidden",
          }}
        >
          {/* SECTION HEADER */}
          <Box
            sx={{
              px: {
                xs: 1.5,
                sm: 2,
              },

              py: 1.5,

              borderBottom: `1px solid ${BORDER}`,

              background: "#FCFDFC",
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                >
                  <Box
                    sx={{
                      width: 30,
                      height: 30,

                      borderRadius: 1.5,

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      background: GREEN_LIGHT,
                      color: GREEN,
                    }}
                  >
                    <ReceiptLongIcon
                      sx={{
                        fontSize: 18,
                      }}
                    />
                  </Box>

                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 800,
                      color: TEXT,
                    }}
                  >
                    Recent Invoices
                  </Typography>
                </Stack>

                <Typography
                  variant="caption"
                  sx={{
                    color: TEXT_SECONDARY,
                    display: "block",
                    mt: 0.5,
                    ml: 4.75,
                  }}
                >
                  Latest 5 invoices
                </Typography>
              </Box>

              <Button
                component={Link}
                href="/invoices"
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  fontWeight: 700,
                  color: GREEN,

                  "&:hover": {
                    background: GREEN_LIGHT,
                  },
                }}
              >
                View All
              </Button>
            </Stack>
          </Box>

          {/* LOADING */}
          {recentLoading ? (
            <Stack
              spacing={1}
              sx={{
                p: 1.5,
              }}
            >
              {[1, 2, 3, 4, 5].map((item) => (
                <Skeleton
                  key={item}
                  variant="rounded"
                  height={42}
                />
              ))}
            </Stack>
          ) : recentInvoices.length === 0 ? (
            /* EMPTY STATE */
            <Box
              sx={{
                py: 5,
                px: 2,

                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 54,
                  height: 54,

                  mx: "auto",
                  mb: 1.5,

                  borderRadius: "50%",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  background: GREEN_LIGHT,
                  color: GREEN,
                }}
              >
                <ReceiptLongIcon />
              </Box>

              <Typography
                sx={{
                  fontWeight: 700,
                  color: TEXT,
                  mb: 0.25,
                }}
              >
                No invoices available
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Create your first invoice to see it here.
              </Typography>
            </Box>
          ) : (
            /* TABLE */
            <Box
              sx={{
                overflowX: "auto",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  minWidth: 650,

                  borderCollapse: "collapse",

                  "& th": {
                    background: "#F7F9F8",

                    color: "#66756D",

                    fontSize: 11.5,

                    fontWeight: 800,

                    textAlign: "left",

                    px: 1.5,
                    py: 1.25,

                    borderBottom: `1px solid ${BORDER}`,

                    whiteSpace: "nowrap",
                  },

                  "& td": {
                    px: 1.5,
                    py: 1.2,

                    fontSize: 13,

                    borderBottom: `1px solid ${BORDER}`,

                    color: "#344054",
                  },

                  "& tbody tr": {
                    transition: "background 0.15s ease",

                    "&:hover": {
                      background: "#FAFCFB",
                    },
                  },

                  "& tbody tr:last-child td": {
                    borderBottom: 0,
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Bill To</th>

                    <th
                      style={{
                        textAlign: "right",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice._id}>
                      {/* INVOICE */}
                      <td>
                        <Typography
                          sx={{
                            fontSize: 13,

                            fontWeight: 800,

                            color: GREEN,

                            whiteSpace: "nowrap",
                          }}
                        >
                          {invoice.invoiceNo || "-"}
                        </Typography>
                      </td>

                      {/* DATE */}
                      <td>
                        {formatDate(
                          invoice.invoiceDate ||
                            invoice.createdAt
                        )}
                      </td>

                      {/* TYPE */}
                      <td>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-flex",

                            px: 1,
                            py: 0.4,

                            borderRadius: 1,

                            fontSize: 10.5,

                            fontWeight: 800,

                            background:
                              invoice.type === "dealer"
                                ? GOLD_LIGHT
                                : GREEN_LIGHT,

                            color:
                              invoice.type === "dealer"
                                ? GOLD_DARK
                                : GREEN,

                            border:
                              invoice.type === "dealer"
                                ? "1px solid rgba(185,149,79,0.18)"
                                : "1px solid rgba(11,93,59,0.12)",
                          }}
                        >
                          {invoice.type === "dealer"
                            ? "Dealer"
                            : "Customer"}
                        </Box>
                      </td>

                      {/* BILL TO */}
                      <td>
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#344054",
                          }}
                        >
                          {invoice.billTo?.name || "-"}
                        </Typography>
                      </td>

                      {/* AMOUNT */}
                      <td
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 13,

                            fontWeight: 800,

                            color: TEXT,

                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatAmount(
                            invoice.grandTotal
                          )}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
