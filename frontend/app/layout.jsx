import Providers from "./providers";
import Navbar from "../components/Navbar";
import Box from "@mui/material/Box";

export const metadata = {
  title: "Samraddhi Mattresses — Invoice Generator",
  description: "GST invoice generator with Original/Duplicate/Triplicate PDF copies",
  icons: { icon: "/logo.jpg" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Providers>
          <Navbar />
          <Box maxWidth="1100px" mx="auto" px={{ xs: 1.5, sm: 2, md: 3 }} py={{ xs: 2, md: 3 }}>
            {children}
          </Box>
        </Providers>
      </body>
    </html>
  );
}
