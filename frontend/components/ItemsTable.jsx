"use client";
import React from "react";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Button,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

const emptyItem = () => ({
  description: "",
  size: "",
  hsnCode: "",
  qty: 1,
  unit: "Pcs.",
  rate: 0,
});

export default function ItemsTable({ items, setItems }) {
  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  };

  const addRow = () => setItems([...items, emptyItem()]);

  const removeRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
      <Typography variant="h6" color="primary" gutterBottom>
        Items
      </Typography>
      {/* Horizontal scroll on small screens instead of squashing/breaking the table */}
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>HSN Code</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Unit</TableCell>
              <TableCell>Rate (Rs.)</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((it, idx) => (
              <TableRow key={idx}>
                <TableCell sx={{ minWidth: 160 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={it.description}
                    placeholder="Product Description"
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 110 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={it.size}
                    placeholder='72"X35"X5"'
                    onChange={(e) => updateItem(idx, "size", e.target.value)}
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 90 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={it.hsnCode}
                    placeholder="9404"
                    onChange={(e) => updateItem(idx, "hsnCode", e.target.value)}
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 70 }}>
                  <TextField
                    size="small"
                    type="number"
                    fullWidth
                    value={it.qty}
                    onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                  />
                </TableCell>
                <TableCell sx={{ minWidth: 80 }}>
                  <TextField size="small" fullWidth value={it.unit} onChange={(e) => updateItem(idx, "unit", e.target.value)} />
                </TableCell>
                <TableCell sx={{ minWidth: 100 }}>
                  <TextField
                    size="small"
                    type="number"
                    fullWidth
                    value={it.rate}
                    onChange={(e) => updateItem(idx, "rate", Number(e.target.value))}
                  />
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  Rs. {((Number(it.qty) || 0) * (Number(it.rate) || 0)).toFixed(2)}
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => removeRow(idx)} disabled={items.length === 1}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Button startIcon={<AddIcon />} onClick={addRow} sx={{ mt: 1 }}>
        Add Item
      </Button>
    </Paper>
  );
}
