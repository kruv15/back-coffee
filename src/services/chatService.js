import { MensajeModel } from "../models/MensajeSchema.js"
import { AsuntoModel } from "../models/AsuntoSchema.js"

class ChatService {
  /**
   * Enviar un mensaje en el chat
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente'
   * @param {string} contenido - Contenido del mensaje
   * @param {string} tipo - 'cliente' o 'admin'
   * @param {string} asuntoId - ID del asunto (opcional, solo para atención al cliente)
   * @returns {Object} Mensaje creado
   */
  async enviarMensaje(usuarioId, tipoChat, contenido, tipo = "cliente", asuntoId = null) {
    try {
      const mensaje = new MensajeModel({
        usuarioId,
        tipoChat,
        asuntoId,
        contenido,
        tipo,
      })

      await mensaje.save()

      console.log(`[CHAT] Mensaje guardado en MongoDB: ${mensaje._id} | Usuario: ${usuarioId}`)

      return {
        id: mensaje._id,
        usuarioId: mensaje.usuarioId,
        tipoChat: mensaje.tipoChat,
        asuntoId: mensaje.asuntoId,
        contenido: mensaje.contenido,
        tipo: mensaje.tipo,
        timestamp: mensaje.timestamp,
        leido: mensaje.leido,
      }
    } catch (error) {
      console.error("[CHAT] Error guardando mensaje:", error.message)
      throw error
    }
  }

  /**
   * Obtener historial de mensajes del usuario
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente'
   * @param {boolean} esAdmin - Si es administrador
   * @param {string} asuntoId - ID del asunto (opcional)
   * @returns {Array} Array de mensajes
   */
  async obtenerHistorial(usuarioId, tipoChat, esAdmin = false, asuntoId = null) {
    try {
      const filtro = {
        usuarioId,
        tipoChat,
      }

      // Si es atención al cliente y hay asuntoId, filtrar por ese asunto
      if (tipoChat === "atencion_cliente" && asuntoId) {
        filtro.asuntoId = asuntoId
      }

      const mensajes = await MensajeModel.find(filtro).sort({ timestamp: 1 }).lean()

      console.log(`[CHAT] Historial obtenido: ${mensajes.length} mensajes para ${usuarioId}`)

      return mensajes.map((msg) => ({
        id: msg._id,
        usuarioId: msg.usuarioId,
        tipoChat: msg.tipoChat,
        asuntoId: msg.asuntoId,
        contenido: msg.contenido,
        tipo: msg.tipo,
        timestamp: msg.timestamp,
        leido: msg.leido,
      }))
    } catch (error) {
      console.error("[CHAT] Error obteniendo historial:", error.message)
      return []
    }
  }

  /**
   * Crear un nuevo asunto (atención al cliente)
   * @param {string} usuarioId - ID del usuario
   * @param {string} titulo - Título del asunto
   * @param {string} descripcion - Descripción del asunto
   * @returns {Object} Asunto creado
   */
  async crearAsunto(usuarioId, titulo, descripcion) {
    try {
      const asunto = new AsuntoModel({
        usuarioId,
        titulo,
        descripcion,
      })

      await asunto.save()

      console.log(`[CHAT] Asunto creado en MongoDB: ${asunto._id} | Usuario: ${usuarioId}`)

      return {
        id: asunto._id,
        usuarioId: asunto.usuarioId,
        titulo: asunto.titulo,
        descripcion: asunto.descripcion,
        estado: asunto.estado,
        prioridad: asunto.prioridad,
        fechaApertura: asunto.fechaApertura,
        timestamp: asunto.timestamp,
      }
    } catch (error) {
      console.error("[CHAT] Error creando asunto:", error.message)
      throw error
    }
  }

  /**
   * Obtener el asunto activo del usuario (atención al cliente)
   * @param {string} usuarioId - ID del usuario
   * @returns {Object|null} Asunto activo o null
   */
  async obtenerAsuntoActivo(usuarioId) {
    try {
      const asunto = await AsuntoModel.findOne({
        usuarioId,
        estado: "abierto",
      })
        .sort({ timestamp: -1 })
        .lean()

      return asunto
        ? {
            id: asunto._id,
            usuarioId: asunto.usuarioId,
            titulo: asunto.titulo,
            descripcion: asunto.descripcion,
            estado: asunto.estado,
            prioridad: asunto.prioridad,
            fechaApertura: asunto.fechaApertura,
            timestamp: asunto.timestamp,
          }
        : null
    } catch (error) {
      console.error("[CHAT] Error obteniendo asunto activo:", error.message)
      return null
    }
  }

  /**
   * Marcar un asunto como resuelto
   * @param {string} usuarioId - ID del usuario
   * @param {string} asuntoId - ID del asunto
   * @returns {boolean} Éxito de la operación
   */
  async marcarAsuntoComoResuelto(usuarioId, asuntoId) {
    try {
      const resultado = await AsuntoModel.findOneAndUpdate(
        { _id: asuntoId, usuarioId },
        { estado: "resuelto", fechaResolucion: new Date() },
        { new: true },
      )

      if (resultado) {
        console.log(`[CHAT] Asunto resuelto: ${asuntoId} | Usuario: ${usuarioId}`)
        return true
      }

      return false
    } catch (error) {
      console.error("[CHAT] Error resolviendo asunto:", error.message)
      return false
    }
  }

  /**
   * Obtener todos los asuntos de un usuario
   * @param {string} usuarioId - ID del usuario
   * @param {string} estado - Filtrar por estado (opcional)
   * @returns {Array} Array de asuntos
   */
  async obtenerAsuntos(usuarioId, estado = null) {
    try {
      const filtro = { usuarioId }
      if (estado) {
        filtro.estado = estado
      }

      const asuntos = await AsuntoModel.find(filtro).sort({ timestamp: -1 }).lean()

      return asuntos.map((asunto) => ({
        id: asunto._id,
        usuarioId: asunto.usuarioId,
        titulo: asunto.titulo,
        descripcion: asunto.descripcion,
        estado: asunto.estado,
        prioridad: asunto.prioridad,
        fechaApertura: asunto.fechaApertura,
        fechaResolucion: asunto.fechaResolucion,
        timestamp: asunto.timestamp,
      }))
    } catch (error) {
      console.error("[CHAT] Error obteniendo asuntos:", error.message)
      return []
    }
  }

  /**
   * Obtener estadísticas de chat del usuario
   * @param {string} usuarioId - ID del usuario
   * @returns {Object} Estadísticas
   */
  async obtenerEstadisticas(usuarioId) {
    try {
      const totalMensajes = await MensajeModel.countDocuments({ usuarioId })
      const asuntosAbiertos = await AsuntoModel.countDocuments({
        usuarioId,
        estado: "abierto",
      })
      const asuntosResueltos = await AsuntoModel.countDocuments({
        usuarioId,
        estado: "resuelto",
      })

      return {
        totalMensajes,
        asuntosAbiertos,
        asuntosResueltos,
      }
    } catch (error) {
      console.error("[CHAT] Error obteniendo estadísticas:", error.message)
      return { totalMensajes: 0, asuntosAbiertos: 0, asuntosResueltos: 0 }
    }
  }

  /**
   * Limpiar historial de un usuario (operación admin)
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente' (opcional)
   */
  async limpiarHistorial(usuarioId, tipoChat = null) {
    try {
      const filtro = { usuarioId }
      if (tipoChat) {
        filtro.tipoChat = tipoChat
      }

      await MensajeModel.deleteMany(filtro)
      console.log(`[CHAT] Historial limpiado: ${usuarioId}`)
    } catch (error) {
      console.error("[CHAT] Error limpiando historial:", error.message)
    }
  }
}

// Instancia singleton del servicio de chat con MongoDB
export const chatService = new ChatService()

export default ChatService
