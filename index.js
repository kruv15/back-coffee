import config from "./src/config.js"
import app from "./src/app.js"

const server = app.listen(config.PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${config.PORT}`)
})
