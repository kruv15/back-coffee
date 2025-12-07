import nodemailer from "nodemailer"
import config from "../config.js"

// Crear transporte de email
const crearTransporte = () => {
  // Usa la configuración de email desde variables de entorno
  // Para desarrollo: usar servicio de prueba como Mailtrap o similar
  // Para producción: usar servicio de email real como Gmail, SendGrid, etc.

  if (config.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    })
  }

  // Por defecto, usar configuración genérica
  return nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: config.EMAIL_PORT,
    secure: config.EMAIL_SECURE === "true",
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASS,
    },
  })
}

export const emailService = {
  // Enviar código de recuperación de contraseña
  enviarCodigoRecuperacion: async (emailUsr, nombreUsr, codigo) => {
    try {
      const transporte = crearTransporte()

      const mailOptions = {
        from: config.EMAIL_USER,
        to: emailUsr,
        subject: "Código de recuperación de contraseña - Back Coffee",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Recuperación de Contraseña</h2>
            <p>Hola ${nombreUsr},</p>
            <p>Recibimos una solicitud para recuperar tu contraseña. Usa el siguiente código para continuar:</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
              <h3 style="color: #666; margin: 0;">Tu código de recuperación:</h3>
              <p style="font-size: 28px; font-weight: bold; color: #333; letter-spacing: 2px; margin: 10px 0;">${codigo}</p>
            </div>
            
            <p style="color: #666;">Este código es válido por 30 minutos.</p>
            <p style="color: #666;">Si no solicitaste este cambio, ignora este email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">© 2025 Back Coffee. Todos los derechos reservados.</p>
          </div>
        `,
      }

      await transporte.sendMail(mailOptions)
      return { success: true, message: "Email enviado exitosamente" }
    } catch (error) {
      console.error("Error al enviar email:", error)
      return { success: false, message: "Error al enviar email", error: error.message }
    }
  },

  // Enviar confirmación de cambio de contraseña
  enviarConfirmacionCambioContraseña: async (emailUsr, nombreUsr) => {
    try {
      const transporte = crearTransporte()

      const mailOptions = {
        from: config.EMAIL_USER,
        to: emailUsr,
        subject: "Contraseña actualizada - Back Coffee",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Contraseña Actualizada</h2>
            <p>Hola ${nombreUsr},</p>
            <p>Tu contraseña ha sido actualizada exitosamente.</p>
            
            <p style="color: #666;">Si no realizaste este cambio, por favor contacta con nosotros inmediatamente.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">© 2025 Back Coffee. Todos los derechos reservados.</p>
          </div>
        `,
      }

      await transporte.sendMail(mailOptions)
      return { success: true, message: "Confirmación enviada" }
    } catch (error) {
      console.error("Error al enviar email de confirmación:", error)
      return { success: false, message: "Error al enviar confirmación", error: error.message }
    }
  },
}
