class Mensaje {
  constructor(id, usuarioId, tipoChat, contenido, tipo = "cliente") {
    this.id = id
    this.usuarioId = usuarioId
    this.tipoChat = tipoChat // 'ventas' o 'atencion_cliente'
    this.contenido = contenido
    this.tipo = tipo // 'cliente' o 'admin'
    this.timestamp = new Date().toISOString()
    this.leido = false
  }
}

export default Mensaje
