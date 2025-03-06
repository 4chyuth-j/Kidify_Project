const express = require("express");
const router = express.Router();
const userController = require('../controller/user/userController.js');


router.get('/pageNotFound',userController.pageNotFound);
router.get('/',userController.loadHomepage);
router.get("/signup",userController.loadSignup);
router.get("/login",userController.loadLogin);
router.post("/signup",userController.signup);
router.post("/verify-otp",userController.verifyOtp);







module.exports= router;