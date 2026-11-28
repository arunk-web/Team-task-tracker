const express = require('express')
const app = express()

const authRoutes = require('./routes/auth.routes')
const projectRoutes = require('./routes/project.routes')
const taskRoutes = require('./routes/task.routes')

app.use(express.json())

app.get('/health', (req,res) => {
    res.json({status : 'ok'});
})

app.use('/auth', authRoutes)
app.use('/projects', projectRoutes)
app.use('/tasks', taskRoutes)


app.use((req, res) => {
    res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` }
    })
})


app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON' }
        })
    }

    console.error(err)

    return res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
    })
})

module.exports = app