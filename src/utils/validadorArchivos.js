/**
 * Configuración de límites y validaciones de archivos
 */
export const CONFIG_ARCHIVOS = {
  imagenes: {
    extensionesPermitidas: ["jpg", "jpeg", "png", "gif", "webp"],
    tamaninMaximoMB: 10,
    tamanioMaximoBytes: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  videos: {
    extensionesPermitidas: ["mp4", "avi", "mov", "mkv", "webm"],
    tamanioMaximoMB: 100,
    tamanioMaximoBytes: 100 * 1024 * 1024,
    mimeTypes: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"],
  },
}

/**
 * Validar archivo antes de subir
 * @param {Object} archivo - Objeto del archivo (from multer)
 * @returns {Object} { valido: boolean, error?: string }
 */
export function validarArchivo(archivo) {
  if (!archivo) {
    return { valido: false, error: "No se proporcionó archivo" }
  }

  const { mimetype, size, originalname } = archivo
  const extension = originalname.split(".").pop().toLowerCase()

  // Detectar tipo de archivo por MIME type
  let tipoArchivo = null
  if (CONFIG_ARCHIVOS.imagenes.mimeTypes.includes(mimetype)) {
    tipoArchivo = "imagen"
  } else if (CONFIG_ARCHIVOS.videos.mimeTypes.includes(mimetype)) {
    tipoArchivo = "video"
  } else {
    return { valido: false, error: "Tipo de archivo no permitido" }
  }

  const config = tipoArchivo === "imagen" ? CONFIG_ARCHIVOS.imagenes : CONFIG_ARCHIVOS.videos

  // Validar extensión
  if (!config.extensionesPermitidas.includes(extension)) {
    return {
      valido: false,
      error: `Extensión no permitida. Extensiones válidas: ${config.extensionesPermitidas.join(", ")}`,
    }
  }

  // Validar tamaño
  if (size > config.tamanioMaximoBytes) {
    return {
      valido: false,
      error: `Archivo muy grande. Tamaño máximo: ${config.tamanioMaximoMB}MB`,
    }
  }

  // Validar MIME type
  if (!config.mimeTypes.includes(mimetype)) {
    return { valido: false, error: "Tipo MIME no válido" }
  }

  return { valido: true, tipoArchivo }
}

/**
 * Validar múltiples archivos
 * @param {Array} archivos - Array de archivos
 * @param {number} maxArchivos - Número máximo de archivos
 * @returns {Object} { validos: Array, errores: Array }
 */
export function validarMultiplesArchivos(archivos, maxArchivos = 5) {
  if (!Array.isArray(archivos)) {
    return { validos: [], errores: ["Los archivos deben ser un array"] }
  }

  if (archivos.length > maxArchivos) {
    return {
      validos: [],
      errores: [`Se pueden subir máximo ${maxArchivos} archivos`],
    }
  }

  const validos = []
  const errores = []

  archivos.forEach((archivo, indice) => {
    const resultado = validarArchivo(archivo)
    if (resultado.valido) {
      validos.push({ ...archivo, tipoArchivo: resultado.tipoArchivo })
    } else {
      errores.push(`Archivo ${indice + 1}: ${resultado.error}`)
    }
  })

  return { validos, errores }
}
