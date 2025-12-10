import Usuario from "../models/Usuario.js"
import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"
import config from "../config.js"

export const usuarioController = {
  // Registrar usuario
  registrar: async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const { nombreUsr, apellidoUsr, celUsr, emailUsr, contraseña } = req.body

      // Verificar si el usuario ya existe
      const usuarioExistente = await Usuario.findOne({ emailUsr })
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado",
        })
      }

      // Crear nuevo usuario
      const nuevoUsuario = new Usuario({
        nombreUsr,
        apellidoUsr,
        celUsr,
        emailUsr,
        contraseña,
      })

      await nuevoUsuario.save()

      // Generar token
      const token = jwt.sign({ id: nuevoUsuario._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN })

      res.status(201).json({
        success: true,
        message: "Usuario registrado exitosamente",
        data: {
          usuario: nuevoUsuario,
          token,
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al registrar usuario",
        error: error.message,
      })
    }
  },

  // Iniciar sesión
  login: async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: errors.array(),
        })
      }

      const { emailUsr, contraseña } = req.body

      // Buscar usuario con contraseña
      const usuario = await Usuario.findOne({ emailUsr }).select("+contraseña")
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        })
      }

      // Verificar contraseña
      const contraseñaValida = await usuario.compararContraseña(contraseña)
      if (!contraseñaValida) {
        return res.status(401).json({
          success: false,
          message: "Credenciales inválidas",
        })
      }

      // Generar token
      const token = jwt.sign({ id: usuario._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN })

      // Remover contraseña de la respuesta
      usuario.contraseña = undefined

      res.status(200).json({
        success: true,
        message: "Inicio de sesión exitoso",
        data: {
          usuario,
          token,
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al iniciar sesión",
        error: error.message,
      })
    }
  },

  // Obtener perfil del usuario
  obtenerPerfil: async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: req.usuario,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener perfil",
        error: error.message,
      })
    }
  },

  // Obtener todos los usuarios (solo admin)
  obtenerUsuarios: async (req, res) => {
    try {
      const usuarios = await Usuario.find().sort({ createdAt: -1 })

      res.status(200).json({
        success: true,
        message: "Usuarios obtenidos exitosamente",
        data: usuarios,
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener usuarios",
        error: error.message,
      })
    }
  },
}
