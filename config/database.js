const mysql = require("mysql2")
require("dotenv").config()

// Crear conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
})

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err)
    process.exit(1)
  }
  console.log("Conectado a la base de datos MySQL")
})

// Promisificar para usar async/await
const promiseDb = db.promise()

module.exports = { db, promiseDb }
