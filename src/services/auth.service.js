const bcrypt = require('bcryptjs')
const {findByEmail,createUser} = require('../repositories/user.repository')
const jwt = require('jsonwebtoken')

const registerUser = async (name,email,password) => {
    if(findByEmail(email)){
        return null
    }
    const hash = await bcrypt.hash(password,10)

    const id = createUser(name,email,hash)
    return {id,name,email}
}

const loginUser = async (email,password) => {
    const user =   findByEmail(email);
    if(!user){
        return null;
    }

    const compare = await bcrypt.compare(password,user.password_hash)

    if(!compare){
        return null;
    }

    const token = jwt.sign(
        {id:user.id},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN}
    )

    return {
        token,
        user: {
            id : user.id,
            name: user.name,
            email:user.email
        }
    }
}
module.exports = {registerUser,loginUser}