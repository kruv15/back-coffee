import config from "./src/config.js"

const server = app.listen(config.PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${config.PORT}`)
})
