// const express = require('express')
require('dotenv').config()
const app = require('./src/app')
// const dotenv = require('dotenv')

// const app = express();


// app.use(express.json());


// app.use('/',(req,res) => {
//     res.json({message: 'API running successfully'})
// })


const PORT = process.env.PORT ||  8000

app.listen(PORT , () => {
    console.log(`server running at port ${PORT}`)
})