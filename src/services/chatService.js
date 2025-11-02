import Mensaje from "../models/Mensaje.js"
import Asunto from "../models/Asunto.js"

class ChatService {
  constructor() {
    // Almacenamiento en memoria de mensajes por usuario y tipo de chat
    // Estructura: { usuarioId: { ventas: [], atencion_cliente: [] } }
    this.mensajesPorUsuario = new Map()

    // Almacenamiento de asuntos por usuario (atención al cliente)
    // Estructura: { usuarioId: [Asunto, ...] }
    this.asuntosPorUsuario = new Map()

    // Almacenamiento de pedidos por usuario (para chat de ventas)
    // Estructura: { usuarioId: [pedidoId, ...] }
    this.pedidosPorUsuario = new Map()

    // Contador para generar IDs únicos
    this.contadorMensajes = 0
    this.contadorAsuntos = 0
  }

  /**
   * Enviar un mensaje en el chat
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente'
   * @param {string} contenido - Contenido del mensaje
   * @param {string} tipo - 'cliente' o 'admin'
   * @returns {Mensaje} Mensaje creado
   */
  enviarMensaje(usuarioId, tipoChat, contenido, tipo = "cliente") {
    // Inicializar almacenamiento del usuario si no existe
    if (!this.mensajesPorUsuario.has(usuarioId)) {
      this.mensajesPorUsuario.set(usuarioId, {
        ventas: [],
        atencion_cliente: [],
      })
    }

    // Crear nuevo mensaje
    const mensajeId = `msg_${++this.contadorMensajes}`
    const mensaje = new Mensaje(mensajeId, usuarioId, tipoChat, contenido, tipo)

    // Guardar mensaje
    this.mensajesPorUsuario.get(usuarioId)[tipoChat].push(mensaje)

    console.log(`[CHAT] Mensaje enviado: ${mensajeId} | Usuario: ${usuarioId} | Tipo: ${tipoChat}`)

    return mensaje
  }

  /**
   * Obtener historial de mensajes del usuario
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente'
   * @param {boolean} esAdmin - Si es administrador
   * @returns {Array} Array de mensajes
   */
  obtenerHistorial(usuarioId, tipoChat, esAdmin = false) {
    // Si es administrador, puede ver todos los mensajes
    if (esAdmin) {
      if (!this.mensajesPorUsuario.has(usuarioId)) {
        return []
      }
      return this.mensajesPorUsuario.get(usuarioId)[tipoChat] || []
    }

    // Si es cliente, solo ve mensajes no resueltos (en atención al cliente)
    if (tipoChat === "atencion_cliente") {
      if (!this.asuntosPorUsuario.has(usuarioId)) {
        return []
      }

      const asuntoActivo = this.obtenerAsuntoActivo(usuarioId)
      if (!asuntoActivo) {
        return []
      }

      // Retornar solo mensajes del asunto activo
      if (!this.mensajesPorUsuario.has(usuarioId)) {
        return []
      }
      return this.mensajesPorUsuario.get(usuarioId)[tipoChat].filter((msg) => msg.contenido.includes(asuntoActivo.id))
    }

    // Para ventas, solo mostrar si hay pedidos no completados
    if (tipoChat === "ventas") {
      const pedidosActivos = this.obtenerPedidosActivos(usuarioId)
      if (pedidosActivos.length === 0) {
        return []
      }

      if (!this.mensajesPorUsuario.has(usuarioId)) {
        return []
      }
      return this.mensajesPorUsuario.get(usuarioId)[tipoChat] || []
    }

    if (!this.mensajesPorUsuario.has(usuarioId)) {
      return []
    }
    return this.mensajesPorUsuario.get(usuarioId)[tipoChat] || []
  }

  /**
   * Crear un nuevo asunto (atención al cliente)
   * @param {string} usuarioId - ID del usuario
   * @param {string} titulo - Título del asunto
   * @param {string} descripcion - Descripción del asunto
   * @returns {Asunto} Asunto creado
   */
  crearAsunto(usuarioId, titulo, descripcion) {
    if (!this.asuntosPorUsuario.has(usuarioId)) {
      this.asuntosPorUsuario.set(usuarioId, [])
    }

    const asuntoId = `asunto_${++this.contadorAsuntos}`
    const asunto = new Asunto(asuntoId, usuarioId, titulo, descripcion)

    this.asuntosPorUsuario.get(usuarioId).push(asunto)

    console.log(`[CHAT] Asunto creado: ${asuntoId} | Usuario: ${usuarioId}`)

    return asunto
  }

  /**
   * Obtener el asunto activo del usuario (atención al cliente)
   * @param {string} usuarioId - ID del usuario
   * @returns {Asunto|null} Asunto activo o null
   */
  obtenerAsuntoActivo(usuarioId) {
    if (!this.asuntosPorUsuario.has(usuarioId)) {
      return null
    }

    const asuntos = this.asuntosPorUsuario.get(usuarioId)
    // Retornar el último asunto abierto
    return asuntos.find((asunto) => asunto.estado === "abierto") || null
  }

  /**
   * Marcar un asunto como resuelto
   * @param {string} usuarioId - ID del usuario
   * @param {string} asuntoId - ID del asunto
   * @returns {boolean} Éxito de la operación
   */
  marcarAsuntoComoResuelto(usuarioId, asuntoId) {
    if (!this.asuntosPorUsuario.has(usuarioId)) {
      return false
    }

    const asuntos = this.asuntosPorUsuario.get(usuarioId)
    const asunto = asuntos.find((a) => a.id === asuntoId)

    if (!asunto) {
      return false
    }

    asunto.marcarComoResuelto()

    console.log(`[CHAT] Asunto resuelto: ${asuntoId} | Usuario: ${usuarioId}`)

    return true
  }

  /**
   * Registrar un pedido para el usuario (ventas)
   * @param {string} usuarioId - ID del usuario
   * @param {string} pedidoId - ID del pedido
   */
  registrarPedido(usuarioId, pedidoId) {
    if (!this.pedidosPorUsuario.has(usuarioId)) {
      this.pedidosPorUsuario.set(usuarioId, [])
    }

    if (!this.pedidosPorUsuario.get(usuarioId).includes(pedidoId)) {
      this.pedidosPorUsuario.get(usuarioId).push(pedidoId)
    }
  }

  /**
   * Obtener pedidos activos (no completados) del usuario
   * @param {string} usuarioId - ID del usuario
   * @returns {Array} Array de IDs de pedidos activos
   */
  obtenerPedidosActivos(usuarioId) {
    if (!this.pedidosPorUsuario.has(usuarioId)) {
      return []
    }
    // En un sistema real, aquí se consultaría la BD para verificar el estado
    return this.pedidosPorUsuario.get(usuarioId)
  }

  /**
   * Marcar un pedido como completado
   * @param {string} usuarioId - ID del usuario
   * @param {string} pedidoId - ID del pedido
   */
  marcarPedidoComoCompletado(usuarioId, pedidoId) {
    if (!this.pedidosPorUsuario.has(usuarioId)) {
      return
    }

    const pedidos = this.pedidosPorUsuario.get(usuarioId)
    const indice = pedidos.indexOf(pedidoId)

    if (indice > -1) {
      pedidos.splice(indice, 1)
      console.log(`[CHAT] Pedido completado: ${pedidoId} | Usuario: ${usuarioId}`)
    }
  }

  /**
   * Obtener todos los usuarios con chats activos
   * @returns {Array} Array de usuarioIds
   */
  obtenerUsuariosActivos() {
    return Array.from(this.mensajesPorUsuario.keys())
  }

  /**
   * Limpiar historial de un usuario (operación admin)
   * @param {string} usuarioId - ID del usuario
   * @param {string} tipoChat - 'ventas' o 'atencion_cliente'
   */
  limpiarHistorial(usuarioId, tipoChat) {
    if (!this.mensajesPorUsuario.has(usuarioId)) {
      return
    }

    this.mensajesPorUsuario.get(usuarioId)[tipoChat] = []
    console.log(`[CHAT] Historial limpiado: ${usuarioId} | Tipo: ${tipoChat}`)
  }
}

// Instancia singleton del servicio de chat
export const chatService = new ChatService()

export default ChatService
