const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController.js");



router.get("/login",adminController.loadLogin);







module.exports = router;

