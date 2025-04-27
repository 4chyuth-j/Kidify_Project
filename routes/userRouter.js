const express = require("express");
const router = express.Router();
const userController = require('../controller/user/userController.js');
const profileController = require('../controller/user/profileController.js');
const productController = require('../controller/user/productController.js');
const profileManagement = require('../controller/user/profileManagement.js');
const wishlistController = require('../controller/user/wishlistController.js');
const cartController = require('../controller/user/cartController.js');
const checkoutController = require('../controller/user/checkoutController.js');
const orderController = require('../controller/user/orderController.js');
const walletController = require('../controller/user/walletController.js');
const passport = require("passport");
const {userAuth,adminAuth,ensureOtpExists,ensureEmailSession} = require("../middlewares/auth.js");



router.get('/pageNotFound',userController.pageNotFound);

router.get('/',userController.loadHomepage);

router.get("/signup",userController.loadSignup);

router.post("/signup",userController.signup);

router.get("/verify-otp",userController.getverifyOtp);

router.post("/verify-otp",userController.verifyOtp);

router.post("/resend-otp",userController.resendOtp);

router.get("/login",userController.loadLogin);

router.post("/login",userController.login);

router.get("/logout",userController.logout);


router.get("/forgot-password",profileController.getForgotPassPage);

router.post("/forgot-password",profileController.validateEmail);

router.get("/passwordChangeOtp",ensureOtpExists,profileController.loadOtpPage);

router.post("/verifyPasswordChangeOtp",profileController.verifyPasswordChangeOtp);

router.post('/clearSessionOtp',profileController.clearSessionOtp)

router.post("/resend-forgotPasswordOtp",profileController.resendOTP);

router.get("/reset-Password",ensureEmailSession,profileController.loadResetPassword);

router.post("/reset-Password",ensureEmailSession,profileController.resetPassword);

// load home and shop page 
router.get("/shop",userAuth,userController.loadShopingPage);

// shopping page filters  
router.get("/filter",userAuth,userController.filterProduct);

router.get("/filterPrice",userAuth,userController.filterByPrice);

router.post("/search",userAuth,userController.searchProducts);

// product details page
router.get("/productDetails",userAuth,productController.productDetails)

// profile management
router.get("/userProfile",userAuth,profileManagement.userProfile);

router.get("/change-email",userAuth,profileManagement.loadChangeEmail);

router.post("/change-email",userAuth,profileManagement.ChangeEmail);

router.get("/verify-emailOtp",userAuth,profileManagement.loadOtpPage);

router.post("/verify-emailOtp",userAuth,profileManagement.verifyOtpEmail);

router.get('/change-password',userAuth,profileManagement.loadChangePassword);

router.post('/change-password',userAuth,profileManagement.otpVerificationChangePassword);

router.get('/setNewPassword',userAuth,profileManagement.loadSetPassword);

router.post('/setNewPassword',userAuth,profileManagement.SetPassword);

router.get("/edit-profile",userAuth,profileManagement.getEditProfile);

router.post("/edit-profile",userAuth,profileManagement.editProfile);

//address management
router.get("/address",userAuth,profileManagement.loadAddressManagement);

router.get('/add-address',userAuth,profileManagement.loadAddAddress);

router.post('/add-address',userAuth,profileManagement.addAddress);

router.get('/edit-address',userAuth,profileManagement.getEditAddress);

router.post('/edit-address',userAuth,profileManagement.editAddress);

router.delete('/delete-address',userAuth,profileManagement.deleteAddress);


//wishlist management
router.get('/wishlist',userAuth,wishlistController.loadWishlist);

router.post('/add-to-wishlist',userAuth,wishlistController.addToWishlist);

router.post('/remove-wishlist',userAuth,wishlistController.removeWishlist);


//cart management
router.post('/add-to-cart',userAuth,cartController.addToCart);

router.get("/cart",userAuth,cartController.loadCart);

router.post('/remove-from-cart',userAuth,cartController.removeCartProduct);

router.get('/get-product-stock',userAuth,cartController.getProductStock);

router.post('/update-cart-quantity',userAuth,cartController.updateCartQuantityCount);

router.post("/clearCartProducts",userAuth,cartController.clearCart);


// checkout management
router.get('/checkout',userAuth,checkoutController.loadCheckout);

router.post('/place-order',userAuth,checkoutController.placeOrder);

router.post('/placeOrderOnlinePayment',userAuth,checkoutController.placeOrderOnlinePayment);

router.post('/verify-payment-and-place-order',userAuth,checkoutController.verifyAndPlaceOrder);

router.get('/order-success',userAuth,checkoutController.loadOrderSuccess);

router.get('/paymentFailed',userAuth,checkoutController.loadPaymentFailed);


// order management 
router.get('/orders',userAuth,orderController.loadOrders);

router.get('/order-details',userAuth,orderController.loadOrderDetails);

router.get('/download-invoice',userAuth,orderController.downloadInvoice);

router.post('/cancel-item',userAuth,orderController.cancelItem);

router.post('/return-item',userAuth,orderController.returnOrder);

router.post('/cancel-return',userAuth,orderController.cancelReturnRequest);

//wallet management
router.get('/wallet',userAuth,walletController.loadWalletPage);















// Route to start Google authentication process
router.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] })); // Redirects to Google with scope access

// Google callback route - Handles authentication response from Google
router.get("/google/callback", passport.authenticate('google', { failureRedirect: '/signup'}), (req, res) => {
    
    if (!req.user) { // If user is not found or blocked
        req.flash("error", "Your account has been blocked by the admin.");
        console.log("Flash set:", req.flash("error")); // Debugging
        return res.redirect("/signup"); // Redirect to signup page with flash message
    }



    req.session.user = req.user; // Store user in session
    res.redirect('/'); // If authentication is successful, redirect to homepage
    // If authentication fails, the user is redirected to /signup (handled by failureRedirect)
});




module.exports= router;