import express from "express"
import { body } from "express-validator"
import { pedidoController } from "../controllers/pedidoController.js"
import { auth, adminAuth } from "../middlewares/auth.js"

const router = express.Router()

const validacionPedido = [
  body("productos").isArray({ min: 1 }).withMessage("Debe incluir al menos un producto"),
  body("productos.*.productoId").isMongoId().withMessage("ID de producto inválido"),
  body("productos.*.cantidad").isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero positivo"),
  body("productos.*.tamano").trim().isLength({ min: 1 }).withMessage("El tamaño es requerido"),
  body("direccionEntrega").trim(),
  body("infoAdicional").trim(),
]

const validacionEstado = [
  body("status")
    .isIn(["pendiente", "confirmado", "preparando", "listo", "entregado", "cancelado"])
    .withMessage("Estado inválido"),
]

// Rutas de usuario autenticado
router.post("/", auth, validacionPedido, pedidoController.crearPedido)
router.get("/mis-pedidos", auth, pedidoController.obtenerMisPedidos)

// Rutas de administrador
router.get("/", adminAuth, pedidoController.obtenerTodosPedidos)
router.put("/:id/estado", adminAuth, validacionEstado, pedidoController.actualizarEstadoPedido)

export default router
