const express = require('express')
const app = express()

const authRoutes = require('./routes/auth.routes')
const projectRoutes = require('./routes/project.routes')

app.use(express.json())

app.get('/health', (req,res) => {
    res.json({status : 'ok'});
})

app.use('/auth', authRoutes)
app.use('/projects', projectRoutes)


module.exports = app