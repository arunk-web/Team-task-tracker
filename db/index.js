// database connection

const Database = require('better-sqlite3')

const dbPath = process.env.DB_PATH || './dev.db'

const db = new Database(dbPath)

db.program('foreign_keys = ON')

module.exports = db

