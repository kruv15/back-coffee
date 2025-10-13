import Pedido from "../models/Pedido.js"
import Producto from "../models/Producto.js"
import { validationResult } from "express-validator"

export const pedidoController = {
  // Crear pedido
  crearPedido: async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const { productos, direccionEntrega, infoAdicional  } = req.body
      let total = 0
      const productosValidados = []

      // Validar productos y calcular total
      for (const item of productos) {
        const producto = await Producto.findById(item.productoId)

        if (!producto) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${item.productoId} no encontrado`,
          })
        }

        if (producto.stock < item.cantidad) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${producto.nomProd}. Stock disponible: ${producto.stock}`,
          })
        }

        const subtotal = producto.precioProd * item.cantidad
        total += subtotal

        productosValidados.push({
          productoId: producto._id,
          cantidad: item.cantidad,
          precio: producto.precioProd,
        })

        // Actualizar stock
        producto.stock -= item.cantidad
        await producto.save()
      }

      // Crear pedido
      const nuevoPedido = new Pedido({
        userId: req.usuario._id,
        productos: productosValidados,
        total,
        direccionEntrega,
        infoAdicional,
      })

      await nuevoPedido.save()
      await nuevoPedido.populate("productos.productoId userId")

      res.status(201).json({
        success: true,
        message: "Pedido creado exitosamente",
        data: nuevoPedido,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al crear pedido",
        error: error.message,
      })
    }
  },

  // Obtener pedidos del usuario
  obtenerMisPedidos: async (req, res) => {
    try {
      const pedidos = await Pedido.find({ userId: req.usuario._id })
        .populate("productos.productoId")
        .sort({ createdAt: -1 })

      res.status(200).json({
        success: true,
        message: "Pedidos obtenidos exitosamente",
        data: pedidos,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener pedidos",
        error: error.message,
      })
    }
  },

  // Obtener todos los pedidos (solo admin)
  obtenerTodosPedidos: async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query
      const filtros = {}

      if (status) {
        filtros.status = status
      }

      const pedidos = await Pedido.find(filtros)
        .populate("userId productos.productoId")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)

      const total = await Pedido.countDocuments(filtros)

      res.status(200).json({
        success: true,
        message: "Pedidos obtenidos exitosamente",
        data: {
          pedidos,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total,
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener pedidos",
        error: error.message,
      })
    }
  },

  // Actualizar estado del pedido (solo admin)
  actualizarEstadoPedido: async (req, res) => {
    try {
      const { status } = req.body

      const pedido = await Pedido.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true },
      ).populate("userId productos.productoId")

      if (!pedido) {
        return res.status(404).json({
          success: false,
          message: "Pedido no encontrado",
        })
      }

      res.status(200).json({
        success: true,
        message: "Estado del pedido actualizado exitosamente",
        data: pedido,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al actualizar estado del pedido",
        error: error.message,
      })
    }
  },
}
