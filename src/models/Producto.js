import mongoose from "mongoose"

const productoSchema = new mongoose.Schema({
  nomProd: {
    type: String,
    required: [true],
    trim: true,
    maxlength: [100, "El nombre no puede exceder 100 caracteres"],
  },
  descripcionProd: {
    type: String,
    required: [true],
    trim: true,
    maxlength: [500, "La descripción no puede exceder 500 caracteres"],
  },
  precioProd: {
    type: Number,
    required: [true],
    min: [0, "El precio no puede ser negativo"],
  },
  stock: {
    type: Number,
    required: [true],
    min: [0, "El stock no puede ser negativo"],
    default: 0,
  },
  categoria: {
    type: String,
    required: [true],
    trim: true
  },
  imagen: {
    type: String,
    required: [true],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Índice para búsquedas por categoría
productoSchema.index({ categoria: 1 })

// Índice para búsquedas por nombre
productoSchema.index({ nomProd: "text", descripcionProd: "text" })

export default mongoose.model("Producto", productoSchema)
