const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController.js");
const customerController = require('../controller/admin/customerController.js');
const categoryController = require('../controller/admin/categoryController.js');
const {userAuth,adminAuth} = require("../middlewares/auth.js");


router.get("/login",adminController.loadLogin);

router.post("/login",adminController.login);

router.get("/",adminAuth,adminController.loadDashboard);

router.get("/logout",adminController.logout);

router.get("/users",adminAuth,customerController.customerInfo);

router.get("/blockCustomer",adminAuth,customerController.customerBlocked);

router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked);

router.get("/pageError",adminAuth,adminController.pageError);

router.get("/category",adminAuth,categoryController.categoryInfo);

router.get("/addCategory",adminAuth,categoryController.loadAddCategory);

router.post("/addCategory",adminAuth,categoryController.addCategory);

router.get("/blockCategory",adminAuth,categoryController.categoryBlocked);

router.get("/unblockCategory",adminAuth,categoryController.categoryUnBlocked);

router.get("/editCategory",adminAuth,categoryController.loadEditCategory);

router.post("/editCategory/:id",adminAuth,categoryController.editCategory);


module.exports = router;

