require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

const connectDB = require("./config/db");
const invoiceRoutes = require("./routes/invoiceRoutes");
const configRoutes = require("./routes/configRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { shutdownPdfEngine } = require("./utils/generatePdf");

const app = express();
const isProd = process.env.NODE_ENV === "production";

// ---- Security & performance middleware ----
app.use(
  helmet({
    // PDFs / iframed previews are same-origin API responses, not remote scripts,
    // so default CSP is fine to relax slightly for the API-only server.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(morgan(isProd ? "combined" : "dev"));

// ---- CORS: only allow the configured frontend origin(s) ----
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "8mb" })); // logo images are base64-encoded in the payload
app.use(mongoSanitize()); // strip any $/. operators from user input before it hits Mongo

// ---- Rate limiting (protects PDF generation + DB from abuse) ----
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// ---- Routes ----
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
app.use("/api/invoices", invoiceRoutes);
app.use("/api/config", configRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, () => console.log(`[server] running on port ${PORT} (${isProd ? "production" : "development"})`));
  })
  .catch((err) => {
    console.error("[server] failed to start - DB connection error:", err.message);
    process.exit(1);
  });

// ---- Graceful shutdown ----
async function shutdown(signal) {
  console.log(`[server] received ${signal}, shutting down gracefully...`);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await shutdownPdfEngine();
    process.exit(0);
  } catch (err) {
    console.error("[server] error during shutdown:", err);
    process.exit(1);
  }
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

module.exports = app;
