import express from "express"
import { body } from "express-validator"
import { usuarioController } from "../controllers/usuarioController.js"
import { auth, adminAuth } from "../middlewares/auth.js"

const router = express.Router()

// Validaciones
const validacionRegistro = [
  body("nombreUsr").trim().isLength({ min: 2, max: 50 }).withMessage("El nombre debe tener entre 2 y 50 caracteres"),
  body("apellidoUsr")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("El apellido debe tener entre 2 y 50 caracteres"),
  body("celUsr")
    .trim()
    .isLength({ min: 8, max: 8 })
    .withMessage("El número debe tener exactamente 8 dígitos")
    .matches(/^[67][0-9]{7}$/)
    .withMessage("Debe comenzar con 6 o 7"),
  body("emailUsr").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("contraseña").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
]

const validacionLogin = [
  body("emailUsr").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("contraseña").notEmpty().withMessage("La contraseña es obligatoria"),
]

const validacionSolicitarRecuperacion = [body("emailUsr").isEmail().normalizeEmail().withMessage("Email inválido")]

const validacionVerificarCodigo = [
  body("emailUsr").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("codigo").notEmpty().withMessage("El código es obligatorio"),
]

const validacionRestablecerContraseña = [
  body("emailUsr").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("codigo").notEmpty().withMessage("El código es obligatorio"),
  body("contraseñaNueva").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
]

// Rutas públicas
router.post("/registrar", validacionRegistro, usuarioController.registrar)
router.post("/login", validacionLogin, usuarioController.login)

router.post("/solicitar-recuperacion", validacionSolicitarRecuperacion, usuarioController.solicitarRecuperacion)
router.post("/verificar-codigo", validacionVerificarCodigo, usuarioController.verificarCodigoRecuperacion)
router.post("/restablecer-contraseña", validacionRestablecerContraseña, usuarioController.restablecerContraseña)

// Rutas protegidas
router.get("/perfil", auth, usuarioController.obtenerPerfil)

// Rutas de administrador
router.get("/", adminAuth, usuarioController.obtenerUsuarios)

export default router
