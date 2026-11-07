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

router.get('/',(req,res) => {
    const projects = projectService.listProjects(req.user.id)

    return res.status(200).json({projects})
})



router.get('/:id', (req,res) => {
    const projectId = Number(req.params.id)

    if(!Number.isInteger(projectId) || projectId <= 0){
        return validationError(res,'Project id must be a positive number')
    }

    const result = projectService.getProject(projectId,req.user.id)

    if(result.error === 'NOT_FOUND'){
        return res.status(404).json({
            error : {code : 'NOT_FOUND', message : 'Project not found'}
        })
    }

    if(result.error === 'FORBIDDEN') {
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'You are not a member of this project' }
        })
    }

    return res.status(200).json({ project: result.project })
})


router.delete('/:id', (req,res) => {
    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id <= 0){
        return validationError(res,'Project id must be a positive number')
    }

    const result = projectService.deleteProject(id,req.user.id)

    if(result.error === 'NOT_FOUND'){
        return res.status(404).json({
            error : {code: 'NOT_FOUND', message: 'Project not found'}
        })
    }

    if(result.error === 'FORBIDDEN'){
        return res.status(403).json({
            error:{code:'FORBIDDEN' , message: 'Only the project owner can delete this project'}
        })
    }

    return res.status(204).send()
})

router.post('/:id/members',(req,res) => {
    const projectId = Number(req.params.id)

    if(!Number.isInteger(projectId) || projectId <= 0){
        return validationError(res,'Project id must be a positive number')
    }

    const {email} = req.body || {}

    if(typeof email !== 'string' || email.trim() === ''){
        return validationError(res,'email is required')
    }

    const cleanEmail = email.trim().toLowerCase()

    const result = projectService.addMember(projectId,req.user.id,cleanEmail)

    if(result.error === 'NOT_FOUND'){
        return res.status(404).json({
            error:{code:'NOT_FOUND',message: 'Project not found'}
        })
    }


    if(result.error === 'FORBIDDEN'){
        return res.status(403).json({
            error:{code:'FORBIDDEN',message: 'Only the project owner can add members'}
        })
    }


    if (result.error === 'USER_NOT_FOUND') {
        return res.status(404).json({
            error: { code: 'USER_NOT_FOUND', message: 'No registered user with this email' }
        })
    }

    if (result.error === 'ALREADY_MEMBER') {
        return res.status(409).json({
            error: { code: 'ALREADY_MEMBER', message: 'User is already a member of this project' }
        })
    }

    return res.status(201).json({ member: result.member })

})

module.exports = router

