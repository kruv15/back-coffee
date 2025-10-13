import mongoose from "mongoose"

const pedidoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: [true],
  },
  productos: [
    {
      productoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true,
      },
      cantidad: {
        type: Number,
        required: true,
        min: [1],
      },
      precio: {
        type: Number,
        required: true,
        min: [0],
      },
    },
  ],
  total: {
    type: Number,
    required: [true],
    min: [0],
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ["pendiente", "confirmado", "preparando", "listo", "entregado", "cancelado"],
      message: "Estado no válido",
    },
    default: "pendiente",
  },
  direccionEntrega: {
    type: String,
    required: true,
    trim: true,
  },
  infoAdicional: {
    type: String,
    default: "",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Índice para búsquedas por usuario
pedidoSchema.index({ userId: 1 })

// Índice para búsquedas por estado
pedidoSchema.index({ status: 1 })

export default mongoose.model("Pedido", pedidoSchema)
