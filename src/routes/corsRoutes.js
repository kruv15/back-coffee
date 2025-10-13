import express from "express"
import { isOriginAllowed } from "../middlewares/corsHandler.js"

const router = express.Router()

// Endpoint para probar CORS
router.get("/test", (req, res) => {
  const origin = req.headers.origin

  res.status(200).json({
    success: true,
    message: "CORS funcionando correctamente",
    data: {
      origin: origin || "No origin header",
      method: req.method,
      headers: req.headers,
      isOriginAllowed: isOriginAllowed(origin),
      timestamp: new Date().toISOString(),
    },
  })
})

// Endpoint para obtener configuración CORS actual
router.get("/config", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Configuración CORS actual",
    data: {
      corsOrigin: process.env.CORS_ORIGIN || "*",
      corsMethods: process.env.CORS_METHODS || "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      corsAllowedHeaders:
        process.env.CORS_ALLOWED_HEADERS || "Origin,X-Requested-With,Content-Type,Accept,Authorization",
      corsCredentials: process.env.CORS_CREDENTIALS === "true",
      nodeEnv: process.env.NODE_ENV,
    },
  })
})

export default router
