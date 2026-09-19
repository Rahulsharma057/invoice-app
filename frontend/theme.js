"use client";
import { createTheme } from "@mui/material/styles";

// Font spec (as provided):
// - Times New Roman: brand headings
// - Cambria: general UI text
// - Calibri: input field data
const theme = createTheme({
  palette: {
    primary: { main: "#0b5d3b" },
    background: { default: "#f4f6f5" },
  },
  typography: {
    fontFamily: "Cambria, Georgia, serif",
    h1: { fontFamily: '"Times New Roman", Times, serif' },
    h2: { fontFamily: '"Times New Roman", Times, serif' },
    h6: { fontFamily: '"Times New Roman", Times, serif' },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          fontFamily: "Calibri, 'Segoe UI', sans-serif",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          fontFamily: "Calibri, 'Segoe UI', sans-serif",
        },
      },
    },
  },
});

export default theme;
