import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const usuarioSchema = new mongoose.Schema({
  nombreUsr: {
    type: String,
    required: [true],
    trim: true,
    maxlength: [50, "El nombre no puede exceder 50 caracteres"],
  },
  apellidoUsr: {
    type: String,
    required: [true],
    trim: true,
    maxlength: [50, "El apellido no puede exceder 50 caracteres"],
  },
  celUsr: {
    type: String,
    required: [true],
    trim: true,
    match: [/^[0-9]{8}$/, "El celular debe tener 8 dígitos"],
  },
  emailUsr: {
    type: String,
    required: [true],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
  },
  contraseña: {
    type: String,
    required: [true],
    minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
    select: false,
  },
  codigoRecuperacion: {
    type: String,
    default: null,
    select: false,
  },
  fechaExpiracionRecuperacion: {
    type: Date,
    default: null,
  },
  roleUsr: {
    type: Boolean,
    default: false, // false = usuario normal, true = administrador
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Middleware para hashear contraseña antes de guardar
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("contraseña")) return next()

  try {
    const { default: config } = await import("../config.js")
    this.contraseña = await bcrypt.hash(this.contraseña, config.BCRYPT_ROUNDS)
    next()
  } catch (error) {
    next(error)
  }
})

// Método para comparar contraseñas
usuarioSchema.methods.compararContraseña = async function (contraseñaIngresada) {
  return await bcrypt.compare(contraseñaIngresada, this.contraseña)
}

usuarioSchema.methods.generarCodigoRecuperacion = function () {
  // Generar código de 6 dígitos
  const codigo = Math.floor(100000 + Math.random() * 900000).toString()
  // Establecer expiración en 30 minutos
  this.codigoRecuperacion = codigo
  this.fechaExpiracionRecuperacion = new Date(Date.now() + 30 * 60 * 1000)
  return codigo
}

usuarioSchema.methods.verificarCodigoRecuperacion = function (codigoIngresado) {
  if (!this.codigoRecuperacion || !this.fechaExpiracionRecuperacion) {
    return false
  }

  // Verificar si el código ha expirado
  if (new Date() > this.fechaExpiracionRecuperacion) {
    return false
  }

  // Comparar códigos
  return this.codigoRecuperacion === codigoIngresado.toString()
}

usuarioSchema.methods.limpiarCodigoRecuperacion = function () {
  this.codigoRecuperacion = null
  this.fechaExpiracionRecuperacion = null
}

// Método para obtener datos públicos del usuario
usuarioSchema.methods.toJSON = function () {
  const usuario = this.toObject()
  delete usuario.contraseña
  return usuario
}

export default mongoose.model("Usuario", usuarioSchema)
