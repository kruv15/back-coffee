import mongoose from "mongoose"

const mensajeSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: String,
      required: true,
      index: true,
    },
    tipoChat: {
      type: String,
      enum: ["ventas", "atencion_cliente"],
      required: true,
    },
    asuntoId: {
      type: String,
      index: true,
      default: null, // Para chat de ventas será null
    },
    contenido: {
      type: String,
      required: true,
    },
    tipo: {
      type: String,
      enum: ["cliente", "admin"],
      required: true,
    },
    leido: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
)

// Índice compuesto para búsquedas eficientes
mensajeSchema.index({ usuarioId: 1, tipoChat: 1, timestamp: -1 })
mensajeSchema.index({ asuntoId: 1, timestamp: -1 })

export const MensajeModel = mongoose.model("Mensaje", mensajeSchema)
