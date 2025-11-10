import { MensajeModel } from "../models/Mensaje.js"
import { AsuntoModel } from "../models/Asunto.js"
import Usuario from "../models/Usuario.js"
import cloudinaryService from "./cloudinaryService.js"

class ChatService {
  /**
   * Enviar un mensaje en el chat
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente'
   * @param {string} contenido - Contenido del mensaje
   * @param {string} tipo - 'cliente' o 'admin'
   * @param {string} asuntoId - ID del asunto (opcional)
   * @param {Array} archivos - Array de archivos multimedia (opcional)
   * @returns {Object} Mensaje creado
   */
  async enviarMensaje(usuarioId, tipoChat, contenido, tipo = "cliente", asuntoId = null, archivos = []) {
    try {
      const archivosNormalizados = (archivos || []).map((a) => ({
        tipo: a.tipo || "imagen",
        nombreOriginal: a.nombreOriginal || a.name || "archivo_sin_nombre",
        urlCloudinary: a.urlCloudinary || a.url || "",
        publicId: a.publicId || "",
        tamaño: a.tamaño || 0,
        duracion: a.duracion || null,
        anchoAlto: a.anchoAlto || null,
        subidoEn: new Date(),
      }));

      const mensaje = new MensajeModel({
        usuarioId,
        tipoChat,
        asuntoId,
        contenido,
        tipo,
        archivos: archivosNormalizados.length > 0 ? archivosNormalizados : undefined,
      });

      await mensaje.save();

      console.log(`[CHAT] Mensaje guardado en MongoDB: ${mensaje._id} | Usuario: ${usuarioId}`);

      return {
        id: mensaje._id,
        usuarioId: mensaje.usuarioId,
        tipoChat: mensaje.tipoChat,
        asuntoId: mensaje.asuntoId,
        contenido: mensaje.contenido,
        tipo: mensaje.tipo,
        archivos: mensaje.archivos,
        timestamp: mensaje.timestamp,
        leido: mensaje.leido,
      };
    } catch (error) {
      console.error("[CHAT] Error guardando mensaje:", error.message);
      throw error;
    }
  }

  /**
   * Subir archivo y obtener información
   * @param {Buffer} buffer - Buffer del archivo
   * @param {string} nombreArchivo - Nombre del archivo
   * @param {string} tipoArchivo - 'imagen' o 'video'
   * @returns {Object} Información del archivo subido
   */
  async subirArchivo(buffer, nombreArchivo, tipoArchivo) {
    try {
      const infoArchivo = await cloudinaryService.subirArchivo(buffer, nombreArchivo, tipoArchivo)
      console.log(`[CHAT] Archivo ${tipoArchivo} subido exitosamente: ${infoArchivo.publicId}`)
      return infoArchivo
    } catch (error) {
      console.error("[CHAT] Error subiendo archivo:", error.message)
      throw error
    }
  }

  /**
   * Eliminar archivo de un mensaje
   * @param {string} mensajeId - ID del mensaje
   * @param {string} publicId - ID público del archivo
   * @param {string} tipoArchivo - 'imagen' o 'video'
   */
  async eliminarArchivoDeMensaje(mensajeId, publicId, tipoArchivo) {
    try {
      // Eliminar de Cloudinary
      const eliminado = await cloudinaryService.eliminarArchivo(publicId, tipoArchivo)

      if (eliminado) {
        // Eliminar referencia de la base de datos
        await MensajeModel.findByIdAndUpdate(mensajeId, { $pull: { archivos: { publicId } } }, { new: true })
        console.log(`[CHAT] Archivo eliminado: ${publicId}`)
        return true
      }
      return false
    } catch (error) {
      console.error("[CHAT] Error eliminando archivo:", error.message)
      return false
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
        archivos: msg.archivos,
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

  /**
   * Obtener todas las conversaciones activas con información del usuario
   * @param {string} tipoChat - 'ventas', 'atencion_cliente' o 'todos'
   * @returns {Array} Array de conversaciones con info del usuario
   */
  async obtenerConversacionesActivas(tipoChat = "todos") {
    try {
      console.log(`[CHAT] Obteniendo conversaciones activas: ${tipoChat}`)

      let conversaciones = []

      // Obtener conversaciones de ventas
      if (tipoChat === "ventas" || tipoChat === "todos") {
        const ventasConversaciones = await this.obtenerConversacionesVentas()
        conversaciones = [...conversaciones, ...ventasConversaciones]
      }

      // Obtener conversaciones de atención al cliente
      if (tipoChat === "atencion_cliente" || tipoChat === "todos") {
        const atencionConversaciones = await this.obtenerConversacionesAtencionCliente()
        conversaciones = [...conversaciones, ...atencionConversaciones]
      }

      // Ordenar por último mensaje
      conversaciones.sort((a, b) => new Date(b.ultimoMensaje.timestamp) - new Date(a.ultimoMensaje.timestamp))

      console.log(`[CHAT] ${conversaciones.length} conversaciones activas encontradas`)

      return conversaciones
    } catch (error) {
      console.error("[CHAT] Error obteniendo conversaciones activas:", error.message)
      return []
    }
  }

  /**
   * Obtener conversaciones de ventas activas
   * @returns {Array} Array de conversaciones de ventas
   */
  async obtenerConversacionesVentas() {
    try {
      // Obtener usuarios únicos que tienen mensajes de ventas
      const usuariosConMensajes = await MensajeModel.distinct("usuarioId", {
        tipoChat: "ventas",
      })

      const conversaciones = []

      for (const usuarioId of usuariosConMensajes) {
        // Obtener información del usuario
        const usuario = await Usuario.findById(usuarioId).select("nombreUsr apellidoUsr emailUsr celUsr").lean()

        if (!usuario) continue

        // Obtener último mensaje
        const ultimoMensaje = await MensajeModel.findOne({
          usuarioId,
          tipoChat: "ventas",
        })
          .sort({ timestamp: -1 })
          .lean()

        // Contar mensajes no leídos del cliente
        const mensajesNoLeidos = await MensajeModel.countDocuments({
          usuarioId,
          tipoChat: "ventas",
          tipo: "cliente",
          leido: false,
        })

        // Contar total de mensajes
        const totalMensajes = await MensajeModel.countDocuments({
          usuarioId,
          tipoChat: "ventas",
        })

        conversaciones.push({
          usuarioId,
          tipoChat: "ventas",
          asuntoId: null,
          usuario: {
            nombre: `${usuario.nombreUsr} ${usuario.apellidoUsr}`,
            email: usuario.emailUsr,
            celular: usuario.celUsr,
          },
          ultimoMensaje: {
            contenido: ultimoMensaje.contenido,
            tipo: ultimoMensaje.tipo,
            timestamp: ultimoMensaje.timestamp,
            archivos: ultimoMensaje.archivos,
          },
          mensajesNoLeidos,
          totalMensajes,
          activo: true,
        })
      }

      return conversaciones
    } catch (error) {
      console.error("[CHAT] Error obteniendo conversaciones de ventas:", error.message)
      return []
    }
  }

  /**
   * Obtener conversaciones de atención al cliente activas
   * @returns {Array} Array de conversaciones de atención al cliente
   */
  async obtenerConversacionesAtencionCliente() {
    try {
      // Obtener asuntos abiertos
      const asuntosAbiertos = await AsuntoModel.find({ estado: "abierto" }).sort({ timestamp: -1 }).lean()

      const conversaciones = []

      for (const asunto of asuntosAbiertos) {
        // Obtener información del usuario
        const usuario = await Usuario.findById(asunto.usuarioId).select("nombreUsr apellidoUsr emailUsr celUsr").lean()

        if (!usuario) continue

        // Obtener último mensaje del asunto
        const ultimoMensaje = await MensajeModel.findOne({
          usuarioId: asunto.usuarioId,
          tipoChat: "atencion_cliente",
          asuntoId: asunto._id.toString(),
        })
          .sort({ timestamp: -1 })
          .lean()

        // Contar mensajes no leídos del cliente
        const mensajesNoLeidos = await MensajeModel.countDocuments({
          usuarioId: asunto.usuarioId,
          tipoChat: "atencion_cliente",
          asuntoId: asunto._id.toString(),
          tipo: "cliente",
          leido: false,
        })

        // Contar total de mensajes
        const totalMensajes = await MensajeModel.countDocuments({
          usuarioId: asunto.usuarioId,
          tipoChat: "atencion_cliente",
          asuntoId: asunto._id.toString(),
        })

        conversaciones.push({
          usuarioId: asunto.usuarioId,
          tipoChat: "atencion_cliente",
          asuntoId: asunto._id.toString(),
          asunto: {
            id: asunto._id,
            titulo: asunto.titulo,
            descripcion: asunto.descripcion,
            prioridad: asunto.prioridad,
            fechaApertura: asunto.fechaApertura,
          },
          usuario: {
            nombre: `${usuario.nombreUsr} ${usuario.apellidoUsr}`,
            email: usuario.emailUsr,
            celular: usuario.celUsr,
          },
          ultimoMensaje: ultimoMensaje
            ? {
                contenido: ultimoMensaje.contenido,
                tipo: ultimoMensaje.tipo,
                timestamp: ultimoMensaje.timestamp,
                archivos: ultimoMensaje.archivos,
              }
            : null,
          mensajesNoLeidos,
          totalMensajes,
          activo: true,
        })
      }

      return conversaciones
    } catch (error) {
      console.error("[CHAT] Error obteniendo conversaciones de atención al cliente:", error.message)
      return []
    }
  }

  /**
   * Obtener asuntos pendientes con información del usuario
   * @returns {Array} Array de asuntos con info del usuario
   */
  async obtenerAsuntosPendientesConUsuario() {
    try {
      const asuntos = await AsuntoModel.find({ estado: "abierto" }).sort({ timestamp: -1 }).lean()

      const asuntosConUsuario = []

      for (const asunto of asuntos) {
        const usuario = await Usuario.findById(asunto.usuarioId).select("nombreUsr apellidoUsr emailUsr celUsr").lean()

        if (!usuario) continue

        // Contar mensajes no leídos
        const mensajesNoLeidos = await MensajeModel.countDocuments({
          usuarioId: asunto.usuarioId,
          tipoChat: "atencion_cliente",
          asuntoId: asunto._id.toString(),
          tipo: "cliente",
          leido: false,
        })

        asuntosConUsuario.push({
          id: asunto._id,
          usuarioId: asunto.usuarioId,
          titulo: asunto.titulo,
          descripcion: asunto.descripcion,
          estado: asunto.estado,
          prioridad: asunto.prioridad,
          fechaApertura: asunto.fechaApertura,
          timestamp: asunto.timestamp,
          usuario: {
            nombre: `${usuario.nombreUsr} ${usuario.apellidoUsr}`,
            email: usuario.emailUsr,
            celular: usuario.celUsr,
          },
          mensajesNoLeidos,
        })
      }

      return asuntosConUsuario
    } catch (error) {
      console.error("[CHAT] Error obteniendo asuntos pendientes:", error.message)
      return []
    }
  }

  /**
   * Obtener conversación completa con información del usuario
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente'
   * @param {string} asuntoId - ID del asunto (opcional)
   * @returns {Object} Conversación completa
   */
  async obtenerConversacionCompleta(usuarioId, tipoChat, asuntoId = null) {
    try {
      // Obtener información del usuario
      const usuario = await Usuario.findById(usuarioId).select("nombreUsr apellidoUsr emailUsr celUsr roleUsr").lean()

      if (!usuario) {
        return null
      }

      // Obtener mensajes
      const mensajes = await this.obtenerHistorial(usuarioId, tipoChat, true, asuntoId)

      // Obtener asunto si es atención al cliente
      let asunto = null
      if (tipoChat === "atencion_cliente" && asuntoId) {
        const asuntoData = await AsuntoModel.findById(asuntoId).lean()
        if (asuntoData) {
          asunto = {
            id: asuntoData._id,
            titulo: asuntoData.titulo,
            descripcion: asuntoData.descripcion,
            estado: asuntoData.estado,
            prioridad: asuntoData.prioridad,
            fechaApertura: asuntoData.fechaApertura,
            fechaResolucion: asuntoData.fechaResolucion,
          }
        }
      }

      return {
        usuarioId,
        tipoChat,
        asuntoId,
        usuario: {
          nombre: `${usuario.nombreUsr} ${usuario.apellidoUsr}`,
          email: usuario.emailUsr,
          celular: usuario.celUsr,
          esAdmin: usuario.roleUsr,
        },
        asunto,
        mensajes,
        totalMensajes: mensajes.length,
      }
    } catch (error) {
      console.error("[CHAT] Error obteniendo conversación completa:", error.message)
      return null
    }
  }

  /**
   * Marcar mensajes como leídos
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente'
   * @param {string} asuntoId - ID del asunto (opcional)
   */
  async marcarMensajesComoLeidos(usuarioId, tipoChat, asuntoId = null) {
    try {
      const filtro = {
        usuarioId,
        tipoChat,
        leido: false,
      }

      if (tipoChat === "atencion_cliente" && asuntoId) {
        filtro.asuntoId = asuntoId
      }

      await MensajeModel.updateMany(filtro, { leido: true })

      console.log(`[CHAT] Mensajes marcados como leídos para ${usuarioId}`)
    } catch (error) {
      console.error("[CHAT] Error marcando mensajes como leídos:", error.message)
    }
  }
}

// Instancia singleton del servicio de chat con MongoDB
const chatService = new ChatService()

export default chatService
