import express from "express"
import chatService from "../services/chatService.js"
import upload from "../middlewares/multerConfig.js"
import { validarArchivo } from "../utils/validadorArchivos.js"

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

/**
 * POST /api/chat/subir-archivo
 * Subir archivo (imagen o video) a Cloudinary
 */
router.post("/subir-archivo", upload.single("archivo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó archivo",
      })
    }

    // Validar archivo
    const validacion = validarArchivo(req.file)
    if (!validacion.valido) {
      return res.status(400).json({
        success: false,
        message: validacion.error,
      })
    }

    // Subir a Cloudinary
    const infoArchivo = await chatService.subirArchivo(req.file.buffer, req.file.originalname, validacion.tipoArchivo)

    res.status(200).json({
      success: true,
      message: "Archivo subido exitosamente",
      archivo: infoArchivo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error subiendo archivo:", error)
    res.status(500).json({
      success: false,
      message: "Error subiendo archivo",
      error: error.message,
    })
  }
})

/**
 * DELETE /api/chat/archivo/:mensajeId/:publicId
 * Eliminar archivo de un mensaje
 * Query params: tipoArchivo (imagen|video)
 */
router.delete("/archivo/:mensajeId/:publicId", async (req, res) => {
  try {
    const { mensajeId, publicId } = req.params
    const { tipoArchivo } = req.query

    if (!tipoArchivo || !["imagen", "video"].includes(tipoArchivo)) {
      return res.status(400).json({
        success: false,
        message: "tipoArchivo es requerido y debe ser 'imagen' o 'video'",
      })
    }

    const eliminado = await chatService.eliminarArchivoDeMensaje(mensajeId, publicId, tipoArchivo)

    if (eliminado) {
      res.status(200).json({
        success: true,
        message: "Archivo eliminado exitosamente",
        timestamp: new Date().toISOString(),
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Error al eliminar el archivo",
      })
    }
  } catch (error) {
    console.error("Error eliminando archivo:", error)
    res.status(500).json({
      success: false,
      message: "Error eliminando archivo",
      error: error.message,
    })
  }
})

/**
 * GET /api/chat/admin/conversaciones-activas
 * Obtener todas las conversaciones activas para el admin
 * Query params: tipoChat (ventas|atencion_cliente|todos, opcional)
 */
router.get("/admin/conversaciones-activas", async (req, res) => {
  try {
    const { tipoChat } = req.query

    const conversaciones = await chatService.obtenerConversacionesActivas(tipoChat || "todos")

    res.status(200).json({
      success: true,
      tipoChat: tipoChat || "todos",
      cantidad: conversaciones.length,
      conversaciones,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo conversaciones activas:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo conversaciones activas",
      error: error.message,
    })
  }
})

/**
 * GET /api/chat/admin/asuntos-pendientes
 * Obtener todos los asuntos pendientes con información del usuario
 */
router.get("/admin/asuntos-pendientes", async (req, res) => {
  try {
    const asuntos = await chatService.obtenerAsuntosPendientesConUsuario()

    res.status(200).json({
      success: true,
      cantidad: asuntos.length,
      asuntos,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo asuntos pendientes:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo asuntos pendientes",
      error: error.message,
    })
  }
})

/**
 * GET /api/chat/admin/conversacion/:usuarioId
 * Obtener detalles completos de una conversación específica
 * Query params: tipoChat (ventas|atencion_cliente), asuntoId (opcional)
 */
router.get("/admin/conversacion/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params
    const { tipoChat, asuntoId } = req.query

    if (!tipoChat) {
      return res.status(400).json({
        success: false,
        message: "tipoChat es requerido (ventas o atencion_cliente)",
      })
    }

    const conversacion = await chatService.obtenerConversacionCompleta(usuarioId, tipoChat, asuntoId || null)

    if (!conversacion) {
      return res.status(404).json({
        success: false,
        message: "Conversación no encontrada",
      })
    }

    res.status(200).json({
      success: true,
      conversacion,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo conversación:", error)
    res.status(500).json({
      success: false,
      message: "Error obteniendo conversación",
      error: error.message,
    })
  }
})

/**
 * POST /api/chat/admin/marcar-leido
 * Marcar mensajes como leídos
 */
router.post("/admin/marcar-leido", async (req, res) => {
  try {
    const { usuarioId, tipoChat, asuntoId } = req.body

    if (!usuarioId || !tipoChat) {
      return res.status(400).json({
        success: false,
        message: "usuarioId y tipoChat son requeridos",
      })
    }

    await chatService.marcarMensajesComoLeidos(usuarioId, tipoChat, asuntoId || null)

    res.status(200).json({
      success: true,
      message: "Mensajes marcados como leídos",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error marcando mensajes como leídos:", error)
    res.status(500).json({
      success: false,
      message: "Error marcando mensajes como leídos",
      error: error.message,
    })
  }
})

export default router
