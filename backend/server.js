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

const {
  notFound,
  errorHandler,
} = require("./middleware/errorHandler");

const {
  shutdownPdfEngine,
} = require("./utils/generatePdf");

const app = express();

const isProd = process.env.NODE_ENV === "production";

/*
=========================================================
SECURITY & PERFORMANCE
=========================================================
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(compression());

app.use(
  morgan(
    isProd
      ? "combined"
      : "dev"
  )
);

/*
=========================================================
CORS
=========================================================
*/

const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  // Requests without Origin
  // Example: Postman / server-to-server
  if (!origin) {
    return true;
  }

  // Exact origins from environment variable
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);

    // Local development
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    ) {
      return true;
    }

    // All Vercel deployment URLs
    if (
      url.hostname.endsWith(".vercel.app")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },

    credentials: true,
  })
);

/*
=========================================================
BODY PARSING & SANITIZATION
=========================================================
*/

app.use(
  express.json({
    limit: "8mb",
  })
);

app.use(mongoSanitize());

/*
=========================================================
RATE LIMIT
=========================================================
*/

const limiter = rateLimit({
  windowMs:
    Number(
      process.env.RATE_LIMIT_WINDOW_MS
    ) ||
    15 * 60 * 1000,

  max:
    Number(
      process.env.RATE_LIMIT_MAX
    ) ||
    300,

  standardHeaders: true,

  legacyHeaders: false,
});

app.use("/api", limiter);

/*
=========================================================
HEALTH CHECK
=========================================================
*/

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",
      time: new Date().toISOString(),
    });
  }
);

/*
=========================================================
API ROUTES
=========================================================
*/

app.use(
  "/api/invoices",
  invoiceRoutes
);

app.use(
  "/api/config",
  configRoutes
);

/*
=========================================================
ERROR HANDLING
=========================================================
*/

app.use(notFound);

app.use(errorHandler);

/*
=========================================================
SERVER
=========================================================
*/

const PORT =
  process.env.PORT || 5000;

let server;

connectDB()
  .then(() => {
    server = app.listen(
      PORT,
      () => {
        console.log(
          `[server] running on port ${PORT} (${isProd ? "production" : "development"})`
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      "[server] failed to start - DB connection error:",
      err.message
    );

    process.exit(1);
  });

/*
=========================================================
GRACEFUL SHUTDOWN
=========================================================
*/

async function shutdown(signal) {
  console.log(
    `[server] received ${signal}, shutting down gracefully...`
  );

  try {
    if (server) {
      await new Promise(
        (resolve) =>
          server.close(resolve)
      );
    }

    await shutdownPdfEngine();

    process.exit(0);
  } catch (err) {
    console.error(
      "[server] error during shutdown:",
      err
    );

    process.exit(1);
  }
}

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

module.exports = app;