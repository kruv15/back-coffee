import { WebSocketServer } from "ws"

/**
 * Configurar el servidor WebSocket
 * @param {http.Server} servidor - Servidor HTTP de Express
 * @returns {WebSocketServer} Instancia del servidor WebSocket
 */
export function configurarServidorWebSocket(servidor, path = "/") {
  const wss = new WebSocketServer({ server: servidor, path });
  console.log(`[WebSocket] Servidor iniciado en path ${path}`);
  return wss;
}

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

export default configurarServidorWebSocket
