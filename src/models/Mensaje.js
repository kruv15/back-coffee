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
      default: null,
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
    archivos: [
      {
        tipo: {
          type: String,
          enum: ["imagen", "video"],
          required: true,
        },
        nombreOriginal: {
          type: String,
          required: true,
        },
        urlCloudinary: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
        tamaño: {
          type: Number,
        },
        duracion: {
          type: Number,
        },
        anchoAlto: {
          type: String,
        },
        subidoEn: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

mensajeSchema.index({ usuarioId: 1, tipoChat: 1, timestamp: -1 })
mensajeSchema.index({ asuntoId: 1, timestamp: -1 })

export const MensajeModel = mongoose.model("Mensaje", mensajeSchema)
