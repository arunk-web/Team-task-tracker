const db = require('./db')

console.log(db.prepare('SELECT * FROM projects').all())
console.log(db.prepare('SELECT * FROM project_members').all())