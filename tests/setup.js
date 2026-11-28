process.env.DB_PATH = ':memory:'
process.env.JWT_SECRET = 'test-secret'
process.env.JWT_EXPIRES_IN = '1d'

const fs = require('fs')
const path = require('path')
const db = require('../db')

const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8')
db.exec(schema)