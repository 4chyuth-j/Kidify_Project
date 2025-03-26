const Product = require("../../model/productSchema");
const Category = require("../../model/categorySchema");
const User = require("../../model/userSchema");



const productDetails = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate("category");
        const findCategory = product.category;
        
        const productOffer = product.discountPercentage || 0;

        res.render("product-details");
    } catch (error) {
        console.log("something went wrong while displaying product details page");
        res.redirect("/pageNotFound");
    }
}


module.exports ={
    productDetails,
}