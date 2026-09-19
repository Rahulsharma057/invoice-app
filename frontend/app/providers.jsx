"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "../theme";

export default function Providers({ children }) {
  // One QueryClient per browser session. staleTime is intentionally generous:
  // once a page of invoices (or the config) has been fetched, react-query
  // serves it straight from cache on remount/tab-switch instead of refetching,
  // and only goes back to the network when data is actually invalidated
  // (after create/update/delete) or the cache entry expires.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute: fresh, no background refetch
            gcTime: 30 * 60 * 1000, // keep unused cache around for 30 min
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} autoHideDuration={4000}>
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
