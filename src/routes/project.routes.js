const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/auth')
const projectService = require('../services/project.service')

router.use(authMiddleware)

function validationError(res,message){
    return res.status(400).json({
        error :{code: 'VALIDATION_ERROR', message}
    })
}

router.post('/',(req,res) => {
    const {name , description} = req.body || {}

    if(typeof name !== 'string' || name.trim() === ''){
        return validationError(res,'Project Name is required')
    }

    if(description !== undefined && typeof description !== 'string'){
        return validationError(res,'Description must be a string')
    }

    const project = projectService.createProject(name.trim(), description, req.user.id)

    return res.status(201).json({project})
})


module.exports = router

