const express = require("express");
const dotenv = require("dotenv").config();//used to load environment variables from a .env file into process.env in a Node.js application.
const connectDB = require("./config/db.js");
const app = express();



connectDB();

app.listen(process.env.PORT,()=>{
    
    
    console.log("Server started at 4000");
} );

module.exports = app;