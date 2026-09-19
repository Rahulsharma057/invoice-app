"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useTheme } from "@mui/material/styles";

export default function PreviewDialog({ open, onClose, previewUrl, loading }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#0b5d3b", color: "#fff" }}>
        Invoice Preview
        <IconButton onClick={onClose} sx={{ color: "#fff" }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: "#eee", minHeight: 420 }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 420, gap: 2 }}>
            <CircularProgress />
            <Typography color="text.secondary">Generating preview...</Typography>
          </Box>
        ) : previewUrl ? (
          <iframe title="invoice-preview" src={previewUrl} style={{ width: "100%", height: fullScreen ? "calc(100vh - 120px)" : "75vh", border: "none" }} />
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 420 }}>
            <Typography color="text.secondary">Preview not available yet.</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 1.5 }}>
        {previewUrl && (
          <Button startIcon={<OpenInNewIcon />} onClick={() => window.open(previewUrl, "_blank")}>
            Open in New Tab / Print
          </Button>
        )}
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
