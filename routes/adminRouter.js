const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController.js");



router.get("/login",adminController.loadLogin);
router.post("/login",adminController.login);
router.get("/",adminController.loadDashboard);





module.exports = router;

