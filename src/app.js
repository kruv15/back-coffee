import express from "express"
import cors from "cors"
import corsConfig from "./config/cors.js"

const app = express()

app.use(cors(corsConfig))          
app.use(express.json())

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API de Back-Coffee funcionando",
    version: "1.0.0",
  })
})

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Ruta no encontrada" })
})

export default app
