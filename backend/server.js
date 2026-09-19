// ---- CORS ----
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ||
  "http://localhost:3000"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  // Postman, server-to-server requests, health checks, etc.
  if (!origin) return true;

  // Exact origins from FRONTEND_ORIGIN
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

    // Allow all Vercel deployments
    if (url.hostname.endsWith(".vercel.app")) {
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
        new Error(`CORS blocked origin: ${origin}`)
      );
    },
    credentials: true,
  })
);