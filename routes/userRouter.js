const express = require("express");
const router = express.Router();
const userController = require('../controller/user/userController.js');
const passport = require("passport");


router.get('/pageNotFound',userController.pageNotFound);
router.get('/',userController.loadHomepage);
router.get("/signup",userController.loadSignup);
router.post("/signup",userController.signup);
router.post("/verify-otp",userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

router.get("/login",userController.loadLogin);
router.post("/login",userController.login);


// Route to start Google authentication process
router.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] })); // Redirects to Google with scope access

// Google callback route - Handles authentication response from Google
router.get("/google/callback", passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
    res.redirect('/'); // If authentication is successful, redirect to homepage
    // If authentication fails, the user is redirected to /signup (handled by failureRedirect)
});




module.exports= router;