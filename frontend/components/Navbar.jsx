
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
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleIcon from "@mui/icons-material/AddCircle";

import { usePathname } from "next/navigation";
import { useTheme } from "@mui/material/styles";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <DashboardIcon fontSize="small" />,
  },
  {
    href: "/",
    label: "New Invoice",
    icon: <ReceiptLongIcon fontSize="small" />,
  },
  {
    href: "/invoices",
    label: "Saved Invoices",
    icon: <ListAltIcon fontSize="small" />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <SettingsIcon fontSize="small" />,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [drawerOpen, setDrawerOpen] = useState(false);

  const linkStyle = (active) => ({
    color: "#fff",
    fontWeight: active ? 700 : 500,

    borderBottom: active
      ? "2px solid #d9b676"
      : "2px solid transparent",

    borderRadius: 0,

    transition: "all 0.2s ease",

    "&:hover": {
      color: "#d9b676",
      backgroundColor: "transparent",
      borderBottom: "2px solid rgba(217,182,118,0.65)",
    },
  });

  return (
    <AppBar
      position="sticky"
      elevation={2}
      sx={{
        bgcolor: "#0b5d3b",
      }}
    >
      <Toolbar
        sx={{
          gap: 1,
          minHeight: {
            xs: 58,
            sm: 64,
          },
        }}
      >
        {/* LOGO */}
        <Avatar
          src="/logo.jpg"
          alt="Samraddhi Mattresses"
          sx={{
            width: 40,
            height: 40,
            mr: 1,
            border: "2px solid #d9b676",
          }}
        />

        {/* TITLE */}
        <Typography
          variant="h6"
          component="div"
          noWrap
          sx={{
            flexGrow: 1,

            fontFamily: '"Times New Roman", Times, serif',

            fontWeight: 700,

            fontSize: {
              xs: "0.95rem",
              sm: "1.15rem",
              md: "1.25rem",
            },
          }}
        >
          Samraddhi Mattresses — Invoice Generator
        </Typography>

        {/* DESKTOP NAVIGATION */}
        {!isMobile && (
          <Box
            sx={{
              display: "flex",
              gap: 0.75,
              alignItems: "center",
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;

              return (
                <Button
                  key={item.href}
                  component={Link}
                  href={item.href}
                  startIcon={item.icon}
                  sx={linkStyle(active)}
                >
                  {item.label}
                </Button>
              );
            })}

            {/* NEW BUTTON */}
            <Button
              component={Link}
              href="/"
              variant="contained"
              size="small"
              startIcon={<AddCircleIcon />}
              sx={{
                ml: 0.5,

                bgcolor: "#d9b676",
                color: "#0b5d3b",

                fontWeight: 700,

                borderRadius: 1.5,

                px: 1.5,

                "&:hover": {
                  bgcolor: "#c9a55f",
                },
              }}
            >
              New
            </Button>
          </Box>
        )}

        {/* MOBILE MENU BUTTON */}
        {isMobile && (
          <IconButton
            color="inherit"
            edge="end"
            onClick={() => setDrawerOpen(true)}
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      {/* MOBILE DRAWER */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box
          sx={{
            width: 270,
          }}
          role="presentation"
        >
          {/* DRAWER HEADER */}
          <Box
            sx={{
              p: 2,

              display: "flex",
              alignItems: "center",

              gap: 1.5,

              bgcolor: "#0b5d3b",
            }}
          >
            <Avatar
              src="/logo.jpg"
              alt="Samraddhi Mattresses"
              sx={{
                width: 40,
                height: 40,
                border: "2px solid #d9b676",
              }}
            />

            <Typography
              sx={{
                color: "#fff",

                fontWeight: 700,

                fontFamily: '"Times New Roman", Times, serif',
              }}
            >
              Samraddhi Mattresses
            </Typography>
          </Box>

          {/* NAV ITEMS */}
          <List sx={{ p: 1 }}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;

              return (
                <ListItemButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  selected={active}
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,

                    "&.Mui-selected": {
                      bgcolor: "rgba(11,93,59,0.10)",
                      color: "#0b5d3b",
                    },

                    "&.Mui-selected:hover": {
                      bgcolor: "rgba(11,93,59,0.15)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 38,

                      color: active
                        ? "#0b5d3b"
                        : "#667085",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 500,
                      fontSize: 14,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          {/* MOBILE NEW INVOICE BUTTON */}
          <Box
            sx={{
              px: 2,
              pt: 1,
            }}
          >
            <Button
              fullWidth
              component={Link}
              href="/"
              variant="contained"
              startIcon={<AddCircleIcon />}
              onClick={() => setDrawerOpen(false)}
              sx={{
                bgcolor: "#d9b676",

                color: "#0b5d3b",

                fontWeight: 700,

                borderRadius: 1.5,

                "&:hover": {
                  bgcolor: "#c9a55f",
                },
              }}
            >
              New Invoice
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
