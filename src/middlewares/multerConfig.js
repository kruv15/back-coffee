import multer from "multer"
import { CONFIG_ARCHIVOS } from "../utils/validadorArchivos.js"

// Configurar multer para guardar en memoria
const storage = multer.memoryStorage()

// Filtro de archivos
const fileFilter = (req, file, cb) => {
  const extensionesImagenes = CONFIG_ARCHIVOS.imagenes.extensionesPermitidas
  const extensionesVideos = CONFIG_ARCHIVOS.videos.extensionesPermitidas
  const extension = file.originalname.split(".").pop().toLowerCase()

  const esArchivovalido = extensionesImagenes.includes(extension) || extensionesVideos.includes(extension)

  if (esArchivovalido) {
    cb(null, true)
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${extension}`), false)
  }
}

// Crear instancia de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
})

export default upload
