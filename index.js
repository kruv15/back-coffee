import config from "./src/config.js"
import app from "./src/app.js"

const server = app.listen(config.PORT, () => {
  const host = "http://localhost";
  console.log(`Servidor ejecutándose en: ${host}:${config.PORT}`);
})
