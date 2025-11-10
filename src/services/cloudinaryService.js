import { v2 as cloudinary } from "cloudinary"
import config from "../config.js"

// Configurar Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
})

/**
 * Servicio para gestionar cargas de archivos en Cloudinary
 */
class CloudinaryService {
  /**
   * Subir archivo a Cloudinary
   * @param {Buffer} buffer - Buffer del archivo
   * @param {string} nombreArchivo - Nombre del archivo
   * @param {string} tipoArchivo - 'imagen' o 'video'
   * @returns {Object} Información del archivo subido
   */
  async subirArchivo(buffer, nombreArchivo, tipoArchivo) {
    return new Promise((resolve, reject) => {
      try {
        const opciones = {
          resource_type: tipoArchivo === "video" ? "video" : "auto",
          public_id: `back-coffee/${tipoArchivo}/${Date.now()}_${Math.random().toString(36).substring(7)}`,
          overwrite: false,
        }

        // Configurar opciones según el tipo de archivo
        if (tipoArchivo === "video") {
          opciones.eager = [{ width: 300, height: 300, crop: "fill", format: "jpg" }]
          opciones.eager_async = true
        }

        const stream = cloudinary.uploader.upload_stream(opciones, (error, resultado) => {
          if (error) {
            reject(new Error(`Error subiendo archivo a Cloudinary: ${error.message}`))
          } else {
            resolve({
              urlCloudinary: resultado.secure_url,
              publicId: resultado.public_id,
              nombreOriginal: nombreArchivo,
              tamaño: resultado.bytes,
              duracion: resultado.duration,
              anchoAlto: `${resultado.width}x${resultado.height}`,
              tipo: tipoArchivo,
            })
          }
        })

        stream.end(buffer)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Eliminar archivo de Cloudinary
   * @param {string} publicId - ID público del archivo
   * @param {string} tipoArchivo - 'imagen' o 'video'
   * @returns {boolean} Éxito de la eliminación
   */
  async eliminarArchivo(publicId, tipoArchivo) {
    try {
      const resultado = await cloudinary.uploader.destroy(publicId, {
        resource_type: tipoArchivo === "video" ? "video" : "image",
      })
      return resultado.result === "ok"
    } catch (error) {
      console.error("[Cloudinary] Error eliminando archivo:", error.message)
      return false
    }
  }

  /**
   * Obtener información del archivo desde Cloudinary
   * @param {string} publicId - ID público del archivo
   * @param {string} tipoArchivo - 'imagen' o 'video'
   * @returns {Object} Información del archivo
   */
  async obtenerInfoArchivo(publicId, tipoArchivo) {
    try {
      const resultado = await cloudinary.api.resource(publicId, {
        resource_type: tipoArchivo === "video" ? "video" : "image",
      })
      return resultado
    } catch (error) {
      console.error("[Cloudinary] Error obteniendo info del archivo:", error.message)
      return null
    }
  }
}

const cloudinaryService = new CloudinaryService()
export default cloudinaryService
