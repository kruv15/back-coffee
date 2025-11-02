import express from "express"
import { chatService } from "../services/chatService.js"

const router = express.Router()

/**
 * GET /api/chat/historial/:usuarioId
 * Obtener historial de chat de un usuario
 * Query params: tipoChat (ventas|atencion_cliente), asuntoId (opcional)
 */
router.get("/historial/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params
    const { tipoChat, asuntoId } = req.query

    if (!tipoChat) {
      return res.status(400).json({
        success: false,
        message: "tipoChat es requerido (ventas o atencion_cliente)",
      })
    }

    if (!["ventas", "atencion_cliente"].includes(tipoChat)) {
      return res.status(400).json({
        success: false,
        message: 'tipoChat debe ser "ventas" o "atencion_cliente"',
      })
    }

    const historial = await chatService.obtenerHistorial(usuarioId, tipoChat, true, asuntoId || null)

    res.status(200).json({
      success: true,
      usuarioId,
      tipoChat,
      asuntoId: asuntoId || null,
      cantidad: historial.length,
      mensajes: historial,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo historial:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo historial del chat",
      error: error.message,
    })
  }
})

/**
 * GET /api/chat/asuntos/:usuarioId
 * Obtener asuntos de un usuario
 * Query params: estado (abierto|resuelto, opcional)
 */
router.get("/asuntos/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params
    const { estado } = req.query

    const asuntos = await chatService.obtenerAsuntos(usuarioId, estado || null)

    res.status(200).json({
      success: true,
      usuarioId,
      estado: estado || "todos",
      cantidad: asuntos.length,
      asuntos,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo asuntos:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo asuntos",
      error: error.message,
    })
  }
})

/**
 * GET /api/chat/asunto-activo/:usuarioId
 * Obtener el asunto activo (abierto) del usuario
 */
router.get("/asunto-activo/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params

    const asunto = await chatService.obtenerAsuntoActivo(usuarioId)

    if (!asunto) {
      return res.status(404).json({
        success: false,
        message: "No hay asuntos activos para este usuario",
        usuarioId,
      })
    }

    res.status(200).json({
      success: true,
      usuarioId,
      asunto,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo asunto activo:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo asunto activo",
      error: error.message,
    })
  }
})

/**
 * GET /api/chat/estadisticas/:usuarioId
 * Obtener estadísticas de chat del usuario
 */
router.get("/estadisticas/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params

    const estadisticas = await chatService.obtenerEstadisticas(usuarioId)

    res.status(200).json({
      success: true,
      usuarioId,
      estadisticas,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo estadísticas",
      error: error.message,
    })
  }
})

/**
 * DELETE /api/chat/historial/:usuarioId
 * Limpiar historial de un usuario (SOLO ADMIN)
 * Query params: tipoChat (opcional, si no se envía limpia todo)
 */
router.delete("/historial/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params
    const { tipoChat } = req.query

    await chatService.limpiarHistorial(usuarioId, tipoChat || null)

    res.status(200).json({
      success: true,
      message: "Historial limpiado correctamente",
      usuarioId,
      tipoChat: tipoChat || "todos",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error limpiando historial:", error)
    res.status(500).json({
      success: false,
      message: "Error limpiando historial",
      error: error.message,
    })
  }
})

export default router
