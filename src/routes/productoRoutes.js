import express from "express"
import { body } from "express-validator"
import { productoController } from "../controllers/productoController.js"
import { adminAuth } from "../middlewares/auth.js"

const router = express.Router()

// Validaciones
const validacionProducto = [
  body("nomProd").trim().isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres"),
  body("descripcionProd")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("La descripción debe tener entre 10 y 500 caracteres"),
  body("precioProd").isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
  body("stock").isInt({ min: 0 }).withMessage("El stock debe ser un número entero positivo"),
  body("categoria")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("La categoría debe tener entre 2 y 50 caracteres"),
  body("imagen").trim().isURL().withMessage("La imagen debe ser una URL válida"),
]

// Rutas públicas
router.get("/", productoController.obtenerProductos)
router.get("/:id", productoController.obtenerProductoPorId)

// Rutas de administrador
router.post("/", adminAuth, validacionProducto, productoController.crearProducto)
router.put("/:id", adminAuth, validacionProducto, productoController.actualizarProducto)
router.delete("/:id", adminAuth, productoController.eliminarProducto)

export default router
