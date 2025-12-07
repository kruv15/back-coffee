import express from "express"
import { body } from "express-validator"
import { categoriaController } from "../controllers/categoriaController.js"
import { adminAuth } from "../middlewares/auth.js"

const router = express.Router()

// Validación para crear/actualizar categoría
const validacionCategoria = [
  body("nombre").trim().isLength({ min: 2, max: 50 }).withMessage("El nombre debe tener entre 2 y 50 caracteres"),
]

// Rutas públicas
router.get("/", categoriaController.obtenerCategorias)
router.get("/basicas", categoriaController.obtenerCategoriasBasicas)
router.get("/:id", categoriaController.obtenerCategoriaPorId)

// Rutas de administrador
router.post("/", adminAuth, validacionCategoria, categoriaController.crearCategoria)
router.put("/:id", adminAuth, validacionCategoria, categoriaController.actualizarCategoria)
router.delete("/:id", adminAuth, categoriaController.eliminarCategoria)

export default router
