import dotenv from "dotenv"

dotenv.config();

const config = {
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  BCRYPT_ROUNDS: Number.parseInt(process.env.BCRYPT_ROUNDS),
  NODE_ENV: process.env.NODE_ENV,

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  CORS_METHODS: process.env.CORS_METHODS || "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  CORS_ALLOWED_HEADERS: process.env.CORS_ALLOWED_HEADERS || "Origin,X-Requested-With,Content-Type,Accept,Authorization",
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === "true" || false,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
}

export default config
