import chatService from "../services/chatService.js"

/**
 * Mapa para almacenar conexiones activas
 * Estructura: { usuarioId: { tipo: 'cliente'|'admin', ws: WebSocket } }
 */
export const conexionesActivas = new Map()

/**
 * Mapa para rastrear a qué usuario está conectado cada cliente
 * Estructura: { wsId: usuarioId }
 */
export const mapeoConexiones = new Map()

let contadorConexiones = 0

/**
 * Configurar manejadores de eventos WebSocket
 * @param {WebSocket} ws - Conexión WebSocket
 * @param {WebSocketServer} wss - Servidor WebSocket
 */
export function configurarManejaodres(ws, wss) {
  const wsId = `ws_${++contadorConexiones}`

  console.log(`[WebSocket] Nueva conexión: ${wsId}`)

  ws.on("message", (data) => {
    manejarMensaje(data, ws, wsId, wss)
  })

  ws.on("pong", () => { 
    ws.isAlive = true; 
  })

  ws.on("close", () => {
    manejarDesconexion(wsId)
  })

  ws.on("error", (error) => {
    console.error(`[WebSocket] Error en conexión ${wsId}:`, error)
  })
}

/**
 * Procesar mensaje recibido del cliente
 * @param {string} data - Datos recibidos
 * @param {WebSocket} ws - Conexión WebSocket
 * @param {string} wsId - ID de la conexión
 * @param {WebSocketServer} wss - Servidor WebSocket
 */
async function manejarMensaje(data, ws, wsId, wss) {
  try {
    const evento = JSON.parse(data)

    console.log(`[WebSocket] Evento recibido (${wsId}):`, evento.tipo)

    switch (evento.tipo) {
      case "conectar":
        manejarConexion(evento, ws, wsId)
        break

      case "enviar_mensaje":
        await manejarEnvioMensaje(evento, ws, wsId, wss)
        break

      case "solicitar_historial":
        await manejarSolicitudHistorial(evento, ws)
        break

      case "crear_asunto":
        await manejarCrearAsunto(evento, ws, wsId, wss)
        break

      case "resolver_asunto":
        await manejarResolverAsunto(evento, ws, wsId, wss)
        break

      case "marcar_pedido_completado":
        await manejarPedidoCompletado(evento, ws, wsId, wss)
        break

      case "solicitar_conversaciones_activas":
        await manejarSolicitudConversacionesActivas(evento, ws)
        break

      case "marcar_leido":
        await manejarMarcarLeido(evento, ws, wsId, wss)
        break

      default:
        enviarError(ws, `Tipo de evento desconocido: ${evento.tipo}`)
    }
  } catch (error) {
    console.error(`[WebSocket] Error procesando mensaje (${wsId}):`, error)
    enviarError(ws, "Error procesando mensaje")
  }
}

/**
 * Manejar conexión inicial del cliente
 */
function manejarConexion(evento, ws, wsId) {
  const { usuarioId, tipoUsuario } = evento
  if (!usuarioId || !tipoUsuario) {
    enviarError(ws, "usuarioId y tipoUsuario son requeridos")
    return
  }

  // ✅ Guardar correctamente los mapas de conexión
  conexionesActivas.set(usuarioId, { tipo: tipoUsuario, ws })
  mapeoConexiones.set(wsId, usuarioId)

  console.log(`[WebSocket] Usuario conectado: ${usuarioId} (${tipoUsuario}) - ${wsId}`)

  ws.send(
    JSON.stringify({
      tipo: "confirmacion_conexion",
      exito: true,
      usuarioId,
      mensaje: `Conectado como ${tipoUsuario}`,
      timestamp: new Date().toISOString(),
    }),
  )
}

/**
 * Manejar envío de mensaje
 * Ahora guarda en MongoDB en lugar de memoria
 */
async function manejarEnvioMensaje(evento, ws, wsId, wss) {
  const { usuarioId, tipoChat, contenido, asuntoId } = evento
  const emisorId = mapeoConexiones.get(wsId)
  const conexion = conexionesActivas.get(emisorId)
  let tipoEmisor = conexion ? conexion.tipo : null

  // ✅ Si no está registrado, intentar deducir del evento
  if (!tipoEmisor && evento.tipoUsuario) {
    tipoEmisor = evento.tipoUsuario
  }

  if (!usuarioId || !tipoChat || !contenido) {
    enviarError(ws, "usuarioId, tipoChat y contenido son requeridos")
    return
  }

  if (!tipoEmisor) {
    enviarError(ws, "No se pudo determinar el tipo de emisor (admin o cliente)")
    return
  }

  try {
    const mensaje = await chatService.enviarMensaje(
      usuarioId,
      tipoChat,
      contenido,
      tipoEmisor,
      asuntoId || null
    )

    console.log(`[Chat] Mensaje guardado correctamente (${tipoEmisor} → ${usuarioId})`)

    ws.send(
      JSON.stringify({
        tipo: "confirmacion_mensaje",
        exito: true,
        mensajeId: mensaje.id,
        timestamp: mensaje.timestamp,
      })
    )

    if (tipoEmisor === "cliente") {
      enviarMensajeAAdmin(mensaje)
    } else if (tipoEmisor === "admin") {
      enviarMensajeAlCliente(usuarioId, mensaje)
    }
  } catch (error) {
    console.error("[Chat] Error guardando mensaje:", error)
    enviarError(ws, "Error al guardar el mensaje")
  }
}

/**
 * Manejar solicitud de historial
 * Ahora obtiene del MongoDB
 */
async function manejarSolicitudHistorial(evento, ws) {
  const { usuarioId, tipoChat, asuntoId } = evento

  if (!usuarioId || !tipoChat) {
    enviarError(ws, "usuarioId y tipoChat son requeridos")
    return
  }

  try {
    const historial = await chatService.obtenerHistorial(usuarioId, tipoChat, false, asuntoId || null)

    ws.send(
      JSON.stringify({
        tipo: "historial",
        usuarioId,
        tipoChat,
        mensajes: historial,
        cantidad: historial.length,
        timestamp: new Date().toISOString(),
      }),
    )

    console.log(`[Chat] Historial enviado: ${historial.length} mensajes para ${usuarioId}`)
  } catch (error) {
    console.error("[Chat] Error obteniendo historial:", error)
    enviarError(ws, "Error al obtener historial")
  }
}

/**
 * Manejar creación de asunto (atención al cliente)
 * Ahora guarda en MongoDB
 */
async function manejarCrearAsunto(evento, ws, wsId, wss) {
  const { usuarioId, titulo, descripcion } = evento

  if (!usuarioId || !titulo || !descripcion) {
    enviarError(ws, "usuarioId, titulo y descripcion son requeridos")
    return
  }

  try {
    const asunto = await chatService.crearAsunto(usuarioId, titulo, descripcion)

    // Confirmar al cliente
    ws.send(
      JSON.stringify({
        tipo: "confirmacion_asunto",
        exito: true,
        asuntoId: asunto.id,
        asunto: asunto,
        timestamp: new Date().toISOString(),
      }),
    )

    // Notificar al admin con información del usuario
    await notificarAdminNuevoAsunto(asunto, usuarioId)

    console.log(`[Chat] Asunto creado: ${asunto.id} para usuario ${usuarioId}`)
  } catch (error) {
    console.error("[Chat] Error creando asunto:", error)
    enviarError(ws, "Error al crear asunto")
  }
}

/**
 * Manejar resolución de asunto (admin)
 * Ahora actualiza MongoDB
 */
async function manejarResolverAsunto(evento, ws, wsId, wss) {
  const { usuarioId, asuntoId } = evento
  const conexion = conexionesActivas.get(mapeoConexiones.get(wsId))

  if (conexion?.tipo !== "admin") {
    enviarError(ws, "Solo los administradores pueden resolver asuntos")
    return
  }

  if (!usuarioId || !asuntoId) {
    enviarError(ws, "usuarioId y asuntoId son requeridos")
    return
  }

  try {
    const exito = await chatService.marcarAsuntoComoResuelto(usuarioId, asuntoId)

    ws.send(
      JSON.stringify({
        tipo: "confirmacion_resolucion",
        exito,
        asuntoId,
        timestamp: new Date().toISOString(),
      }),
    )

    if (exito) {
      // Notificar al cliente que su asunto fue resuelto
      notificarClienteAsuntoResuelto(usuarioId, asuntoId)
    }
  } catch (error) {
    console.error("[Chat] Error resolviendo asunto:", error)
    enviarError(ws, "Error al resolver asunto")
  }
}

/**
 * Manejar marcación de pedido como completado
 */
async function manejarPedidoCompletado(evento, ws, wsId, wss) {
  const { usuarioId, pedidoId } = evento
  const conexion = conexionesActivas.get(mapeoConexiones.get(wsId))

  if (conexion?.tipo !== "admin") {
    enviarError(ws, "Solo los administradores pueden marcar pedidos como completados")
    return
  }

  if (!usuarioId || !pedidoId) {
    enviarError(ws, "usuarioId y pedidoId son requeridos")
    return
  }

  ws.send(
    JSON.stringify({
      tipo: "confirmacion_pedido_completado",
      exito: true,
      pedidoId,
      timestamp: new Date().toISOString(),
    }),
  )

  // Notificar al cliente
  notificarClientePedidoCompletado(usuarioId, pedidoId)
}

/**
 * Manejar solicitud de conversaciones activas (admin)
 */
async function manejarSolicitudConversacionesActivas(evento, ws) {
  const { tipoChat } = evento

  try {
    const conversaciones = await chatService.obtenerConversacionesActivas(tipoChat || "todos")

    ws.send(
      JSON.stringify({
        tipo: "conversaciones_activas",
        tipoChat: tipoChat || "todos",
        cantidad: conversaciones.length,
        conversaciones,
        timestamp: new Date().toISOString(),
      }),
    )

    console.log(`[Chat] Conversaciones activas enviadas: ${conversaciones.length}`)
  } catch (error) {
    console.error("[Chat] Error obteniendo conversaciones activas:", error)
    enviarError(ws, "Error al obtener conversaciones activas")
  }
}

/**
 * Manejar marcado de mensajes como leídos
 */
async function manejarMarcarLeido(evento, ws, wsId, wss) {
  const { usuarioId, tipoChat, asuntoId } = evento

  if (!usuarioId || !tipoChat) {
    enviarError(ws, "usuarioId y tipoChat son requeridos")
    return
  }

  try {
    await chatService.marcarMensajesComoLeidos(usuarioId, tipoChat, asuntoId || null)

    ws.send(
      JSON.stringify({
        tipo: "confirmacion_marcar_leido",
        exito: true,
        timestamp: new Date().toISOString(),
      }),
    )

    console.log(`[Chat] Mensajes marcados como leídos para ${usuarioId}`)
  } catch (error) {
    console.error("[Chat] Error marcando mensajes como leídos:", error)
    enviarError(ws, "Error al marcar mensajes como leídos")
  }
}

/**
 * Manejar desconexión
 */
function manejarDesconexion(wsId) {
  const usuarioId = mapeoConexiones.get(wsId)

  if (usuarioId) {
    conexionesActivas.delete(usuarioId)
    mapeoConexiones.delete(wsId)
    console.log(`[WebSocket] Usuario desconectado: ${usuarioId} (${wsId})`)
  }
}

/**
 * Enviar mensaje al cliente específico
 */
function enviarMensajeAlCliente(usuarioId, mensaje) {
  const conexion = conexionesActivas.get(usuarioId)

  if (conexion && conexion.ws.readyState === 1) {
    conexion.ws.send(
      JSON.stringify({
        tipo: "nuevo_mensaje",
        mensaje,
        timestamp: new Date().toISOString(),
      }),
    )
  }
}

/**
 * Enviar mensaje a todos los admins conectados con información del usuario
 */
async function enviarMensajeAAdmin(mensaje, usuarioId) {
  try {
    // Obtener información del usuario para enviar al admin
    const conversacion = await chatService.obtenerConversacionCompleta(usuarioId, mensaje.tipoChat, mensaje.asuntoId)

    for (const [adminId, conexion] of conexionesActivas.entries()) {
      if (conexion.tipo === "admin" && conexion.ws.readyState === 1) {
        conexion.ws.send(
          JSON.stringify({
            tipo: "nuevo_mensaje",
            mensaje,
            usuario: conversacion?.usuario || null,
            timestamp: new Date().toISOString(),
          }),
        )
      }
    }
  } catch (error) {
    console.error("[Chat] Error enviando mensaje a admin:", error)
  }
}

/**
 * Notificar a admin sobre nuevo asunto con información del usuario
 */
async function notificarAdminNuevoAsunto(asunto, usuarioId) {
  try {
    // Obtener información del usuario
    const conversacion = await chatService.obtenerConversacionCompleta(usuarioId, "atencion_cliente", asunto.id)

    for (const [adminId, conexion] of conexionesActivas.entries()) {
      if (conexion.tipo === "admin" && conexion.ws.readyState === 1) {
        conexion.ws.send(
          JSON.stringify({
            tipo: "nuevo_asunto",
            asunto,
            usuario: conversacion?.usuario || null,
            timestamp: new Date().toISOString(),
          }),
        )
      }
    }
  } catch (error) {
    console.error("[Chat] Error notificando nuevo asunto:", error)
  }
}

/**
 * Notificar al cliente que su asunto fue resuelto
 */
function notificarClienteAsuntoResuelto(usuarioId, asuntoId) {
  const conexion = conexionesActivas.get(usuarioId)

  if (conexion && conexion.ws.readyState === 1) {
    conexion.ws.send(
      JSON.stringify({
        tipo: "asunto_resuelto",
        asuntoId,
        timestamp: new Date().toISOString(),
      }),
    )
  }
}

/**
 * Notificar al cliente que su pedido fue completado
 */
function notificarClientePedidoCompletado(usuarioId, pedidoId) {
  const conexion = conexionesActivas.get(usuarioId)

  if (conexion && conexion.ws.readyState === 1) {
    conexion.ws.send(
      JSON.stringify({
        tipo: "pedido_completado",
        pedidoId,
        timestamp: new Date().toISOString(),
      }),
    )
  }
}

/**
 * Enviar error al cliente
 */
function enviarError(ws, mensaje) {
  ws.send(
    JSON.stringify({
      tipo: "error",
      mensaje,
      timestamp: new Date().toISOString(),
    }),
  )
}

export { manejarMensaje, manejarConexion, enviarMensajeAlCliente, enviarMensajeAAdmin }
