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


const addProducts = async (req,res)=>{
    try {
        
      const products = req.body;
    //   console.log(req.body);
      const productExists = await Product.findOne({
        productName:products.productName,
      });

      if(!productExists){
        
        const images = [];

        if(req.files && req.files.length>0){
            for(let i=0; i<req.files.length; i++){
                const originalImagePath = req.files[i].path;
                const resizedImagePath = path.join('public',"uploads","product-images",req.files[i].filename);
                images.push(req.files[i].filename);
            }
        }

     const categoryId = await Category.findOne({ _id:products.category });
     
     if(!categoryId){
        return res.status(400).json("Invalid category")
     }


     const basePrice = parseFloat(products.basePrice); // Ensure it's a number
     
     const newProduct = new Product({
        productName:products.productName,
        description:products.description,
        brand:products.brand,
        category:categoryId._id,
        basePrice:basePrice,
        discountPercentage:products.discountPercentage,
        stock:products.stock,
        productImage:images,
        status:"Available",

     });

     await newProduct.save();
     console.log("product saved in db successfully");
     return res.redirect("/admin/addProducts");


      } else{
        return res.status(400).json("Product already exist, please try with another Name")
      }

    } catch (error) {
        console.error("Error saving product",error);
        return res.render("admin-error",{pageTitle:"Page Not found!"});
    }
}



module.exports = {
    loadAddProduct,
    addProducts
}