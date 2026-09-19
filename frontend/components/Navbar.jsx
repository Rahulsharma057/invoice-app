"use client";
import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { usePathname } from "next/navigation";
import { useTheme } from "@mui/material/styles";

const NAV_ITEMS = [
  { href: "/", label: "New Invoice", icon: <ReceiptLongIcon fontSize="small" /> },
  { href: "/invoices", label: "Saved Invoices", icon: <ListAltIcon fontSize="small" /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon fontSize="small" /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const linkStyle = (active) => ({
    color: "#fff",
    fontWeight: active ? 700 : 500,
    borderBottom: active ? "2px solid #fff" : "2px solid transparent",
    borderRadius: 0,
  });

  return (
    <AppBar position="sticky" sx={{ bgcolor: "#0b5d3b" }} elevation={2}>
      <Toolbar sx={{ gap: 1 }}>
        <Avatar
          src="/logo.jpg"
          alt="Samraddhi Mattresses"
          sx={{ width: 40, height: 40, mr: 1, border: "2px solid #d9b676" }}
        />
        <Typography
          variant="h6"
          component="div"
          noWrap
          sx={{
            flexGrow: 1,
            fontFamily: '"Times New Roman", Times, serif',
            fontWeight: 700,
            fontSize: { xs: "0.95rem", sm: "1.15rem", md: "1.25rem" },
          }}
        >
          Samraddhi Mattresses — Invoice Generator
        </Typography>

        {!isMobile && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                startIcon={item.icon}
                sx={linkStyle(pathname === item.href)}
              >
                {item.label}
              </Button>
            ))}
            <Button
              component={Link}
              href="/"
              variant="contained"
              size="small"
              startIcon={<AddCircleIcon />}
              sx={{ bgcolor: "#d9b676", color: "#0b5d3b", fontWeight: 700, "&:hover": { bgcolor: "#c9a55f" } }}
            >
              New
            </Button>
          </Box>
        )}

        {isMobile && (
          <IconButton color="inherit" edge="end" onClick={() => setDrawerOpen(true)} aria-label="menu">
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#0b5d3b" }}>
            <Avatar src="/logo.jpg" sx={{ width: 40, height: 40 }} />
            <Typography sx={{ color: "#fff", fontWeight: 700, fontFamily: '"Times New Roman", Times, serif' }}>
              Samraddhi Mattresses
            </Typography>
          </Box>
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItemButton key={item.href} component={Link} href={item.href} selected={pathname === item.href}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
