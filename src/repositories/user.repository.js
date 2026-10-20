const db = require('../../db')

function findByEmail(email){
    return db.prepare('SELECT * FROM users WHERE email=?').get(email)
}

function createUser(name,email,passwordHash){
    const result = db.prepare('INSERT INTO users (name,email,password_hash) VALUES(?,?,?)').run(name,email,passwordHash)
    return result.lastInsertRowid
}

module.exports = {findByEmail,createUser}

