import express from "express"
import { chatService } from "../services/chatService.js"

const router = express.Router()

/**
 * GET /api/chat/historial/:usuarioId
 * Obtener historial de chat de un usuario
 */
router.get("/historial/:usuarioId", (req, res) => {
  try {
    const { usuarioId } = req.params
    const { tipoChat } = req.query

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

    const historial = chatService.obtenerHistorial(usuarioId, tipoChat, true)

    res.status(200).json({
      success: true,
      usuarioId,
      tipoChat,
      cantidad: historial.length,
      mensajes: historial,
    })
  } catch (error) {
    console.error("Error obteniendo historial:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo historial del chat",
    })
  }
})

/**
 * GET /api/chat/asuntos/:usuarioId
 * Obtener asuntos de un usuario
 */
router.get("/asuntos/:usuarioId", (req, res) => {
  try {
    const { usuarioId } = req.params

    const asuntos = chatService.asuntosPorUsuario.get(usuarioId) || []

    res.status(200).json({
      success: true,
      usuarioId,
      cantidad: asuntos.length,
      asuntos,
    })
  } catch (error) {
    console.error("Error obteniendo asuntos:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo asuntos",
    })
  }
})

/**
 * GET /api/chat/usuarios-activos
 * Obtener usuarios con chats activos
 */
router.get("/usuarios-activos", (req, res) => {
  try {
    const usuariosActivos = chatService.obtenerUsuariosActivos()

    res.status(200).json({
      success: true,
      cantidad: usuariosActivos.length,
      usuarios: usuariosActivos,
    })
  } catch (error) {
    console.error("Error obteniendo usuarios activos:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo usuarios activos",
    })
  }
})

export default router
