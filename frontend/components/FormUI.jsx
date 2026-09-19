"use client";

import {
  Paper,
  Typography,
  Grid,
  TextField,
} from "@mui/material";

// Shared small building blocks used across InvoiceForm,
// ItemsTable and Settings.

export function SectionCard({
  title,
  action,
  children,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: 1.5,
          sm: 2,
        },
        mb: 2,
        borderRadius: 2,
      }}
    >
      <Typography
        variant="h6"
        color="primary"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: {
            xs: "1.05rem",
            sm: "1.25rem",
          },
        }}
      >
        {title}

        {action}
      </Typography>

      <Grid
        container
        spacing={2}
      >
        {children}
      </Grid>
    </Paper>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  md = 4,
  required,
  error = false,
  helperText = "",
  sx,
  ...rest
}) {
  return (
    <Grid
      item
      xs={12}
      sm={6}
      md={md}
      sx={{
        minWidth: 0,
      }}
    >
      <TextField
        label={label}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={onChange}
        type={type}
        fullWidth
        size="small"
        required={required}
        error={error}
        helperText={helperText}
        InputLabelProps={
          type === "date"
            ? {
                shrink: true,
              }
            : undefined
        }
        sx={{
          "& .MuiInputBase-root": {
            minHeight: 42,
            borderRadius: 1.5,
          },

          "& .MuiInputBase-input": {
            boxSizing: "border-box",
          },

          "& .MuiFormHelperText-root": {
            minHeight: helperText ? "18px" : "0px",
            marginTop: "4px",
            marginLeft: 0,
            marginRight: 0,
            lineHeight: 1.25,
            fontSize: "11px",
          },

          ...sx,
        }}
        {...rest}
      />
    </Grid>
  );
}