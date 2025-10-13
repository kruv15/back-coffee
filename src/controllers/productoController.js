import Producto from "../models/Producto.js"
import { validationResult } from "express-validator"

export const productoController = {
  // Crear producto (solo admin)
  crearProducto: async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const nuevoProducto = new Producto(req.body)
      await nuevoProducto.save()

      res.status(201).json({
        success: true,
        message: "Producto creado exitosamente",
        data: nuevoProducto,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear producto",
        error: error.message,
      })
    }
  },

  // Obtener todos los productos
  obtenerProductos: async (req, res) => {
    try {
      const { categoria, buscar, page = 1, limit = 10 } = req.query
      const filtros = {}

      // Filtro por categoría
      if (categoria) {
        filtros.categoria = categoria
      }

      // Búsqueda por texto
      if (buscar) {
        filtros.$text = { $search: buscar }
      }

      const productos = await Producto.find(filtros)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)

      const total = await Producto.countDocuments(filtros)

      res.status(200).json({
        success: true,
        message: "Productos obtenidos exitosamente",
        data: {
          productos,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total,
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener productos",
        error: error.message,
      })
    }
  },

  // Obtener producto por ID
  obtenerProductoPorId: async (req, res) => {
    try {
      const producto = await Producto.findById(req.params.id)

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        })
      }

      res.status(200).json({
        success: true,
        message: "Producto obtenido exitosamente",
        data: producto,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener producto",
        error: error.message,
      })
    }
  },

  // Actualizar producto (solo admin)
  actualizarProducto: async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        })
      }

      res.status(200).json({
        success: true,
        message: "Producto actualizado exitosamente",
        data: producto,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar producto",
        error: error.message,
      })
    }
  },

  // Eliminar producto (solo admin)
  eliminarProducto: async (req, res) => {
    try {
      const producto = await Producto.findByIdAndDelete(req.params.id)

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        })
      }

      res.status(200).json({
        success: true,
        message: "Producto eliminado exitosamente",
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar producto",
        error: error.message,
      })
    }
  },
}
