const errorHandler = (err, req, res, next) => {
  console.error("Error:", err)

  // Error de validación de Mongoose
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errors,
    })
  }

  // Error de duplicado (email único)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({
      success: false,
      message: `El ${field} ya está registrado`,
    })
  }

  // Error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    })
  }

  // Error de JWT expirado
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expirado",
    })
  }

  // Error por defecto
  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  })
}

export default errorHandler
