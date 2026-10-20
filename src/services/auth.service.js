const bcrypt = require('bcryptjs')
const {findByEmail,createUser} = require('../repositories/user.repository')

const registerUser = async (name,email,password) => {
    if(findByEmail(email)){
        return null
    }
    const hash = await bcrypt.hash(password,10)

    const id = createUser(name,email,hash)
    return {id,name,email}
}


module.exports = {registerUser}