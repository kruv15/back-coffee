import Usuario from "../models/Usuario.js"
import jwt from "jsonwebtoken"
import { validationResult } from "express-validator"
import config from "../config.js"
import { OAuth2Client } from "google-auth-library"

// Inicializar cliente de Google
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

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
        authMethod: "local",
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

  googleLogin: async (req, res) => {
    try {
      const { token: googleToken } = req.body

      // Validar que el token de Google sea proporcionado
      if (!googleToken) {
        return res.status(400).json({
          success: false,
          message: "Token de Google es requerido",
        })
      }

      // Verificar y decodificar el token de Google
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })

      const payload = ticket.getPayload()
      const { sub: googleId, email: emailUsr, name: nombreUsr, picture: googleProfilePicture } = payload

      // Buscar usuario existente por googleId o email
      let usuario = await Usuario.findOne({
        $or: [{ googleId }, { emailUsr }],
      })

      // Si el usuario NO existe, crearlo
      if (!usuario) {
        // Separar nombre y apellido si es posible
        const [nombre, ...apellidoParts] = nombreUsr.split(" ")
        const apellido = apellidoParts.length > 0 ? apellidoParts.join(" ") : "Apellido"

        usuario = new Usuario({
          nombreUsr: nombre || "Usuario",
          apellidoUsr: apellido,
          emailUsr,
          googleId,
          googleProfilePicture,
          authMethod: "google",
          // No incluir contraseña para usuarios de Google
          celUsr: "00000000", // Valor por defecto (puede ser actualizado después)
        })

        await usuario.save()
      } else if (!usuario.googleId) {
        // Si existe pero no tiene googleId, vincularlo
        usuario.googleId = googleId
        usuario.authMethod = "google"
        if (!usuario.googleProfilePicture && googleProfilePicture) {
          usuario.googleProfilePicture = googleProfilePicture
        }
        await usuario.save()
      }

      // Generar token JWT
      const jwtToken = jwt.sign({ id: usuario._id }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN,
      })

      res.status(200).json({
        success: true,
        message: "Inicio de sesión con Google exitoso",
        data: {
          usuario,
          token: jwtToken,
          isNewUser: !usuario.contraseña, // Indica si es un usuario nuevo sin contraseña
        },
      })
    } catch (error) {
      console.error("Error en Google Login:", error)
      res.status(401).json({
        success: false,
        message: "Error al verificar token de Google",
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
