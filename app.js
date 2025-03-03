const express = require("express");
const dotenv = require("dotenv").config();//used to load environment variables from a .env file into process.env in a Node.js application.
const path = require("path");
const connectDB = require("./config/db.js");
const app = express();
const userRouter = require("./routes/userRouter.js");


app.use(express.urlencoded({ extended: true })); //Parses form data from <form>. Without this middleware, req.body will be undefined when handling form data
app.use(express.json());  //Parses JSON data from API requests. Without this, req.body will be undefined when receiving JSON data.

app.set("view engine", "ejs");
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]); /*Tells Express where to find the views (template files).
                                                                                             [] is used in an Express.js app to specify multiple directories for views (templates).*/



app.use(express.static('public'));  /*This is an application level middleware in Express is used to serve static files like CSS, 
                                                                                             JavaScript, images, fonts, and other assets from a directory called public.*/

app.use("/",userRouter);

connectDB();

app.listen(process.env.PORT, () => {


    console.log("Server started at 4000");
});

module.exports = app;