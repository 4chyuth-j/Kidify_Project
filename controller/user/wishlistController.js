const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Wishlist = require("../../model/wishlistSchema");




const loadWishlist = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const products = await 

        res.render('wishlist',{user:userData,})
    } catch (error) {
        
    }
}







module.exports ={
    loadWishlist,
}