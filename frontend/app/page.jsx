"use client";

import { Suspense } from "react";

import {
  Typography,
  Box,
  Skeleton,
  Stack,
} from "@mui/material";

import InvoiceForm from "../components/InvoiceForm";

function InvoiceFormLoading() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="rounded" height={56} />
      <Skeleton variant="rounded" height={140} />
      <Skeleton variant="rounded" height={200} />
      <Skeleton variant="rounded" height={200} />
    </Stack>
  );
}

export default function HomePage() {
  return (
    <Box>
      <Typography
        variant="h4"
        color="primary"
        fontWeight={700}
        gutterBottom
        sx={{
          fontSize: {
            xs: "1.5rem",
            sm: "2.125rem",
          },
        }}
      >
        New Invoice
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Choose the invoice type below, fill the form, then preview or save to
        generate the GST invoice (Original / Duplicate / Triplicate copies in
        one PDF).
      </Typography>

      <Suspense fallback={<InvoiceFormLoading />}>
        <InvoiceForm />
      </Suspense>
    </Box>
  );
}