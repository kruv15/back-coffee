import config from "../config.js";

// Configuración única de CORS
const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = config.CORS_ORIGIN
      ? config.CORS_ORIGIN.split(",").map((o) => o.trim())
      : ["*"];

    // Permitir solicitudes sin "origin" (por ejemplo, Postman, apps móviles)
    if (!origin) return callback(null, true);

    // Si está permitido "*" o el origen está en la lista, se acepta
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origen no permitido: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "X-API-Key",
    "Cache-Control",
  ],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

export default corsConfig;
