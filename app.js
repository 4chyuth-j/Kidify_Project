const express = require("express");
const dotenv = require("dotenv").config();//used to load environment variables from a .env file into process.env in a Node.js application.
const path = require("path");
const session = require("express-session");
const connectDB = require("./config/db.js");
const userRouter = require("./routes/userRouter.js");
const adminRouter = require("./routes/adminRouter.js");
const passport = require("./config/passport.js");


const app = express();



app.use(express.urlencoded({ extended: true })); //Parses form data from <form>. Without this middleware, req.body will be undefined when handling form data
app.use(express.json());  //Parses JSON data from API requests. Without this, req.body will be undefined when receiving JSON data.



app.use(express.static('public'));  /*This is an application level middleware in Express is used to serve static files like CSS, 
                                                                                             JavaScript, images, fonts, and other assets from a directory called public.*/



app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, //during production(hosting) it is set as true
        httpOnly: true,
        maxAge: 72 * 60 * 60 * 1000,
    }
}));


// Initialize passport middleware in the Express application
app.use(passport.initialize()); // This initializes Passport to be used in the application
app.use(passport.session()); // This allows Passport to maintain authentication state across requests

app.use((req, res, next) => {
    res.set('cache-control', 'no-store');
    next();
});
/*cache-control: no-store tells browsers and proxies not to cache the response at all.
Every time the user requests a page, the server must generate a fresh response.
Prevents storing sensitive data like login sessions, user profiles, or private content. */


app.set("view engine", "ejs");
app.set('views', [path.join(__dirname, 'views/user'), path.join(__dirname, 'views/admin')]); /*Tells Express where to find the views (template files).
                                                                                             [] is used in an Express.js app to specify multiple directories for views (templates).*/

const PORT = process.env.PORT || 4000;


app.use("/", userRouter);
app.use("/admin", adminRouter);

connectDB();

app.listen(PORT, () => {


    console.log(`Server started at ${PORT}`);
});

module.exports = app;