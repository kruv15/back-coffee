class Asunto {
  constructor(id, usuarioId, titulo, descripcion) {
    this.id = id
    this.usuarioId = usuarioId
    this.titulo = titulo
    this.descripcion = descripcion
    this.estado = "abierto" // 'abierto' o 'resuelto'
    this.fechaCreacion = new Date().toISOString()
    this.fechaResolucion = null
  }

  marcarComoResuelto() {
    this.estado = "resuelto"
    this.fechaResolucion = new Date().toISOString()
  }
}

export default Asunto
