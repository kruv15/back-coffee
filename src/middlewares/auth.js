import jwt from "jsonwebtoken"
import Usuario from "../models/Usuario.js"
import config from "../config.js"

export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Acceso denegado. Token no proporcionado.",
      })
    }

    const decoded = jwt.verify(token, config.JWT_SECRET)
    const usuario = await Usuario.findById(decoded.id)

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: "Token inválido. Usuario no encontrado.",
      })
    }

    req.usuario = usuario
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Token inválido.",
    })
  }
}

export const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!req.usuario.roleUsr) {
        return res.status(403).json({
          success: false,
          message: "Acceso denegado. Se requieren permisos de administrador.",
        })
      }
      next()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error en la verificación de permisos.",
    })
  }
}
