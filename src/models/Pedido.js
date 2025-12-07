import mongoose from "mongoose"

const pedidoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: [true, "El ID del usuario es requerido"],
  },
  productos: [
    {
      productoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: [true, "El ID del producto es requerido"],
      },
      cantidad: {
        type: Number,
        required: [true, "La cantidad es requerida"],
        min: [1, "La cantidad debe ser mayor a 0"],
      },
      tamano: {
        type: String,
        required: [true, "El tamaño es requerido"],
        trim: true,
      },
      precio: {
        type: Number,
        required: [true, "El precio es requerido"],
        min: [0, "El precio no puede ser negativo"],
      },
    },
  ],
  total: {
    type: Number,
    required: [true, "El total es requerido"],
    min: [0, "El total no puede ser negativo"],
  },
  status: {
    type: String,
    required: [true, "El estado es requerido"],
    enum: {
      values: ["pendiente", "confirmado", "preparando", "listo", "entregado", "cancelado"],
      message: "Estado no válido",
    },
    default: "pendiente",
  },
  direccionEntrega: {
    type: String,
    required: [true, "La dirección de entrega es requerida"],
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
