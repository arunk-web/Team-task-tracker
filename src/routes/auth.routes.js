const express = require('express')
const router = express.Router()


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validationError(res,message){
    return res.status(400).json({
        error :{code: 'VALIDATION_ERROR', message}
    })
}

router.post('/register',(req,res) => {
    const {name,email,password} = req.body || {}

    if(typeof name !== 'string' || name.trim() === ''){
        return validationError(res, 'Name is required')
    }

    if(typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())){
        return validationError(res,'A valid email is required')
    }

    if(typeof password !== 'string' || !password.length < 8){
        return validationError(res,'Password must be at least 8 characters')
    }

    const cleanEmail = email.trim().toLowerCase()

    res.status(200).json({
        name:name.trim(),
        email: cleanEmail
    })
})

module.exports = router
