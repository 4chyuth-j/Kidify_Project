const Product = require("../../model/productSchema");
const Category = require("../../model/categorySchema");
const User = require("../../model/userSchema");
const fs = require("node:fs");
const path = require("node:path");



const loadAddProduct = async (req,res)=>{
    try {
        const category = await Category.find({isListed:true});
        return res.render("addProducts", { pageTitle: "Add Product" ,categories:category});
    } catch (error) {
        console.log("Error in loading add product page:", error);
        res.redirect("/pageError");
    }

}




module.exports = {
    loadAddProduct,
}