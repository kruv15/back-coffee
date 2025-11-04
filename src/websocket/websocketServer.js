import { WebSocketServer } from "ws"

/**
 * Configurar el servidor WebSocket
 * @param {http.Server} servidor - Servidor HTTP de Express
 * @returns {WebSocketServer} Instancia del servidor WebSocket
 */
export function configurarServidorWebSocket(servidor) {
  const wss = new WebSocketServer({ server: servidor })

  console.log("[WebSocket] Servidor WebSocket iniciado")

  return wss
}

export default configurarServidorWebSocket
