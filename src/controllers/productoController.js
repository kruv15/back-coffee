import Producto from "../models/Producto.js"
import Categoria from "../models/Categoria.js"
import { validationResult } from "express-validator"

export const productoController = {
  // Crear producto (solo admin)
  crearProducto: async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log("🔥 BODY RECIBIDO EN BACKEND:", req.body);
        console.log("❌ ERRORES DE VALIDACIÓN:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const { categoria, tamanos } = req.body

      const categoriaExistente = await Categoria.findById(categoria)
      if (!categoriaExistente) {
        return res.status(404).json({
          success: false,
          message: "La categoría especificada no existe",
        })
      }

      if (tamanos && tamanos.length > 0) {
        const nombresTamanos = tamanos.map((t) => t.nombre)
        const nombresTamanosUnicos = new Set(nombresTamanos)
        if (nombresTamanos.length !== nombresTamanosUnicos.size) {
          return res.status(400).json({
            success: false,
            message: "Los tamaños no pueden repetirse",
          })
        }
      }

      const nuevoProducto = new Producto(req.body)
      await nuevoProducto.save()

      await nuevoProducto.populate("categoria", "nombre")

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

      if (categoria) {
        filtros.categoria = categoria
      }

      // Búsqueda por texto
      if (buscar) {
        filtros.$text = { $search: buscar }
      }

      const productos = await Producto.find(filtros)
        .populate("categoria", "nombre") // Poblar nombre de categoría
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
      const producto = await Producto.findById(req.params.id).populate("categoria", "nombre") // Poblar categoría

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
        console.log("🔥 BODY RECIBIDO EN BACKEND:", req.body);
        console.log("❌ ERRORES DE VALIDACIÓN:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const { categoria, tamanos } = req.body

      if (categoria) {
        const categoriaExistente = await Categoria.findById(categoria)
        if (!categoriaExistente) {
          return res.status(404).json({
            success: false,
            message: "La categoría especificada no existe",
          })
        }
      }

      if (tamanos && tamanos.length > 0) {
        const nombresTamanos = tamanos.map((t) => t.nombre)
        const nombresTamanosUnicos = new Set(nombresTamanos)
        if (nombresTamanos.length !== nombresTamanosUnicos.size) {
          return res.status(400).json({
            success: false,
            message: "Los tamaños no pueden repetirse",
          })
        }
      }

      const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("categoria", "nombre") // Poblar categoría en respuesta

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
