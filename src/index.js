// require('dotenv').config()
// import mongoose, { connect } from "mongoose";
// import { DB_NAME } from "./constants";

import dotenv from "dotenv"
import express from "express"



const app = express()


import connectDB from "./db/index.js";

 dotenv.config({
    path: './env'
 })


connectDB()
.then(() => {
    app.listen(process.env.Port || 8000, () =>{
        console.log(` Server is running at port : $ {process.env.Port}`)
    })
})
.catch((err) =>{
    console.log("MONGO db connection failed !!!!!!", err);

})




/*

import express from "express"
const app = express()

;(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",() => {
            console.log("ERRR:", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`app is listening on port $ {process.env.PORT}`) // this is port address of server
        })

    }catch(error){
        console.error("ERRR :", error)
        throw error
    }
})()

*/