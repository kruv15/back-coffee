import express from "express"
import mongoose from "mongoose"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cors from "cors"
import config from "./config.js"

import { validateCorsConfig } from "./config/cors.js"

const app = express()

// Configuración de seguridad
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: "Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.",
  },
})
app.use(limiter)

// Middlewares básicos
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Configuración de CORS
const corsConfig = validateCorsConfig()
app.use(cors(corsConfig))

// Middleware adicional para manejar preflight requests
app.options("*", cors(corsConfig))

app.use(corsHandler)
app.use(corsLogger)

// Ruta de salud para verificar que el servidor funciona
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString(),
  })
})

// Ruta por defecto
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API de Back-Coffee funcionando",
    version: "1.0.0",
  })
})

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Ruta no encontrada",
  })
})

// Middleware de manejo de errores
app.use(errorHandler)

export default app
