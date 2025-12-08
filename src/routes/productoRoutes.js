import express from "express"
import { body } from "express-validator"
import { productoController } from "../controllers/productoController.js"
import { adminAuth } from "../middlewares/auth.js"

const router = express.Router()

const validacionProducto = [
  body("nomProd").trim().isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres"),
  body("descripcionProd")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("La descripción debe tener entre 10 y 500 caracteres"),
  body("stock").isInt({ min: 0 }).withMessage("El stock debe ser un número entero positivo"),
  body("categoria").isMongoId().withMessage("ID de categoría inválido"),
  body("imagen").trim().isURL().withMessage("La imagen debe ser una URL válida"),
  body("tamanos").optional().isArray().withMessage("Tamanos debe ser un array"),
  body("tamanos.*.nombre")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("El nombre del tamaño debe tener entre 1 y 50 caracteres"),
  body("tamanos.*.precio")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("El precio del tamaño debe ser un número positivo"),
]

// Rutas públicas
router.get("/", productoController.obtenerProductos)
router.get("/:id", productoController.obtenerProductoPorId)

// Rutas de administrador
router.post("/", adminAuth, validacionProducto, productoController.crearProducto)
router.put("/:id", adminAuth, validacionProducto, productoController.actualizarProducto)
router.delete("/:id", adminAuth, productoController.eliminarProducto)

export default router
