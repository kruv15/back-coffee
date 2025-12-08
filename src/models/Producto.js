import mongoose from "mongoose"

const productoSchema = new mongoose.Schema({
  nomProd: {
    type: String,
    required: [true, "El nombre del producto es requerido"],
    trim: true,
    maxlength: [100, "El nombre no puede exceder 100 caracteres"],
  },
  descripcionProd: {
    type: String,
    required: [true, "La descripción es requerida"],
    trim: true,
    maxlength: [500, "La descripción no puede exceder 500 caracteres"],
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Categoria",
    required: [true, "La categoría es requerida"],
  },
  tamanos: [
    {
      nombre: {
        type: String,
        required: [true, "El nombre del tamaño es requerido"],
        trim: true,
        example: "250g",
      },
      precio: {
        type: Number,
        required: [true, "El precio del tamaño es requerido"],
        min: [0, "El precio no puede ser negativo"],
      },
      _id: false,
    },
  ],
  stock: {
    type: Number,
    required: [true, "El stock es requerido"],
    min: [0, "El stock no puede ser negativo"],
    default: 0,
  },
  imagen: {
    type: String,
    required: [true, "La imagen es requerida"],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Índice para búsquedas por categoría
productoSchema.index({ categoria: 1 })

// Índice para búsquedas por nombre y descripción
productoSchema.index({ nomProd: "text", descripcionProd: "text" })

export default mongoose.model("Producto", productoSchema)
