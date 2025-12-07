import Categoria from "../models/Categoria.js"
import Producto from "../models/Producto.js"
import { validationResult } from "express-validator"

export const categoriaController = {
  // Crear categoría (solo admin)
  crearCategoria: async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const { nombre } = req.body

      // Verificar si la categoría ya existe
      const categoriaExistente = await Categoria.findOne({ nombre: nombre.toLowerCase() })
      if (categoriaExistente) {
        return res.status(400).json({
          success: false,
          message: "Esta categoría ya existe",
        })
      }

      const nuevaCategoria = new Categoria({ nombre: nombre.toLowerCase() })
      await nuevaCategoria.save()

      res.status(201).json({
        success: true,
        message: "Categoría creada exitosamente",
        data: nuevaCategoria,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear categoría",
        error: error.message,
      })
    }
  },

  // Obtener todas las categorías
  obtenerCategorias: async (req, res) => {
    try {
      const categorias = await Categoria.find().sort({ nombre: 1 })

      res.status(200).json({
        success: true,
        message: "Categorías obtenidas exitosamente",
        data: categorias,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener categorías",
        error: error.message,
      })
    }
  },

  // Obtener categorías (solo nombres e IDs) - para formularios/filtros
  obtenerCategoriasBasicas: async (req, res) => {
    try {
      const categorias = await Categoria.find().select("_id nombre").sort({ nombre: 1 })

      res.status(200).json({
        success: true,
        message: "Categorías obtenidas exitosamente",
        data: categorias,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener categorías",
        error: error.message,
      })
    }
  },

  // Obtener categoría por ID
  obtenerCategoriaPorId: async (req, res) => {
    try {
      const categoria = await Categoria.findById(req.params.id)

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        })
      }

      res.status(200).json({
        success: true,
        message: "Categoría obtenida exitosamente",
        data: categoria,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener categoría",
        error: error.message,
      })
    }
  },

  // Actualizar categoría (solo admin)
  actualizarCategoria: async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const { nombre } = req.body

      // Verificar si el nuevo nombre ya existe en otra categoría
      const categoriaExistente = await Categoria.findOne({
        nombre: nombre.toLowerCase(),
        _id: { $ne: req.params.id },
      })

      if (categoriaExistente) {
        return res.status(400).json({
          success: false,
          message: "Ya existe otra categoría con este nombre",
        })
      }

      const categoria = await Categoria.findByIdAndUpdate(
        req.params.id,
        { nombre: nombre.toLowerCase() },
        { new: true, runValidators: true },
      )

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        })
      }

      res.status(200).json({
        success: true,
        message: "Categoría actualizada exitosamente",
        data: categoria,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar categoría",
        error: error.message,
      })
    }
  },

  // Eliminar categoría (solo admin)
  eliminarCategoria: async (req, res) => {
    try {
      // Verificar si hay productos en esta categoría
      const productosEnCategoria = await Producto.countDocuments({ categoria: req.params.id })

      if (productosEnCategoria > 0) {
        return res.status(400).json({
          success: false,
          message: `No se puede eliminar. Hay ${productosEnCategoria} producto(s) en esta categoría`,
        })
      }

      const categoria = await Categoria.findByIdAndDelete(req.params.id)

      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        })
      }

      res.status(200).json({
        success: true,
        message: "Categoría eliminada exitosamente",
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar categoría",
        error: error.message,
      })
    }
  },
}
