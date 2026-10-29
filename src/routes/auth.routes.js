const express = require('express')
const router = express.Router()
const authService = require('../services/auth.service')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validationError(res,message){
    return res.status(400).json({
        error :{code: 'VALIDATION_ERROR', message}
    })
}

router.post('/register', async (req,res) => {
    const {name,email,password} = req.body || {}

    if(typeof name !== 'string' || name.trim() === ''){
        return validationError(res, 'Name is required')
    }

    if(typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())){
        return validationError(res,'A valid email is required')
    }

    if(typeof password !== 'string' || password.length < 8){
        return validationError(res,'Password must be at least 8 characters')
    }

    const cleanEmail = email.trim().toLowerCase()

    const user = await authService.registerUser(name.trim(),cleanEmail,password)
    if(user === null){
        return res.status(409).json({
            error: {code:'EMAIL_ALREADY_EXISTS',message:'Email is already registered'}
        })
    }
    res.status(201).json({ user })
})


router.post('/login' , async(req,res) => {
    const {email,password} = req.body || {}

    if(typeof email !== 'string' || email.trim() === ''){
        return validationError(res,'Email is required')
    }

    if(typeof password !== 'string' || password === ''){
        return validationError(res,'Password is required')
    }

    const cleanmail = email.trim().toLowerCase()
    
    const result = await authService.loginUser(cleanmail,password)
    
    if(result == null){
        return res.status(401).json({
            error: {code: 'INVALID_CRENDENTIALS' , message : 'Invalid email or password'}
        })
    }

    return res.status(200).json(result)

})

module.exports = router
