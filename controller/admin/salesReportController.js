const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Order = require("../../model/orderSchema");


const loadReportPage = async (req,res)=>{
    try {
        return res.render("salesReport", { pageTitle: "Sales Report" });
    } catch (error) {
        console.log("Error in loading add coupon page:", error);
        res.redirect("/pageError");
    }
}







module.exports ={
    loadReportPage
}