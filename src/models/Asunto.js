import mongoose from "mongoose"

const asuntoSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: String,
      required: true,
      index: true,
    },
    titulo: {
      type: String,
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      enum: ["abierto", "resuelto"],
      default: "abierto",
      index: true,
    },
    prioridad: {
      type: String,
      enum: ["baja", "media", "alta"],
      default: "media",
    },
    fechaApertura: {
      type: Date,
      default: Date.now,
    },
    fechaResolucion: {
      type: Date,
      default: null,
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
asuntoSchema.index({ usuarioId: 1, estado: 1, timestamp: -1 })

export const AsuntoModel = mongoose.model("Asunto", asuntoSchema)
