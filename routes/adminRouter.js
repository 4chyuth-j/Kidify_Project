const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController.js");
const customerController = require('../controller/admin/customerController.js');
const {userAuth,adminAuth} = require("../middlewares/auth.js");


router.get("/login",adminController.loadLogin);

router.post("/login",adminController.login);

router.get("/",adminAuth,adminController.loadDashboard);

router.get("/logout",adminController.logout);

router.get("/users",adminAuth,customerController.customerInfo);

router.get("/blockCustomer",adminAuth,customerController.customerBlocked);

router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked);

router.get("/pageError",adminAuth,adminController.pageError);




module.exports = router;

