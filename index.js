import config from "./src/config.js"
import app from "./src/app.js"
import http from "http"
import configurarServidorWebSocket from "./src/websocket/websocketServer.js"
import { configurarManejaodres } from "./src/websocket/websocketHandler.js"

// Crear servidor HTTP
const servidor = http.createServer(app)

// Configurar servidor WebSocket
const wss = configurarServidorWebSocket(servidor)

// Configurar manejadores de eventos
wss.on("connection", (ws) => {
  configurarManejaodres(ws, wss)
})

// Iniciar servidor
servidor.listen(config.PORT, () => {
  const host = "http://localhost"
  console.log(`Servidor ejecutándose en: ${host}:${config.PORT}`)
  console.log(`WebSocket disponible en: ws://localhost:${config.PORT}`)
})
