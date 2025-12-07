import mongoose from "mongoose"

const categoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, "El nombre de la categoría es requerido"],
    unique: [true, "Ya existe una categoría con este nombre"],
    trim: true,
    maxlength: [50, "El nombre no puede exceder 50 caracteres"],
    minlength: [2, "El nombre debe tener al menos 2 caracteres"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Índice para búsquedas por nombre
categoriaSchema.index({ nombre: 1 })

export default mongoose.model("Categoria", categoriaSchema)
