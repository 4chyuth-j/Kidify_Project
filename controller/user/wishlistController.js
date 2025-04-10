const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Wishlist = require("../../model/wishlistSchema");
const Cart = require("../../model/cartSchema");




const loadWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const userWishlist = await Wishlist.findOne({ userId }).populate("products.productId");

        // Extract all product objects from populated wishlist
        const products = userWishlist
            ? userWishlist.products.map(item => item.productId)
            : [];

        res.render('wishlist', { user: userData, products });

    } catch (error) {
        console.error('error occurred while loading wishlist page', error);
        res.redirect("/pageNotFound");
    }
};



const addToWishlist = async (req,res)=>{
    try {
        const userId = req.session.user;
        const productId = req.query.id;

        const userCart = await Cart.findOne({userId});
        
        const productInCart = userCart?.items.find(item=>{
            return item.productId.toString()===productId.toString()
        });

        if(productInCart){
            return res.status(200).json({message:"Product is already present in the Cart"});
        }

        const userWishlist = await Wishlist.findOne({userId:userId});
        if(!userWishlist){

            const newWishList = new Wishlist({
                userId,
                products:[{productId}]
            });

            await newWishList.save();

            return res.status(200).json({message:"Product added to wishlist"});
        }

        const productExist = userWishlist.products.find(item=>{
            return item.productId.toString()===productId.toString();
        })
        if(productExist){
            return res.status(200).json({ message: "Already in wishlist" });
        }

        userWishlist.products.push({ productId });
        await userWishlist.save();

        return res.status(200).json({ message: "Added to wishlist" });
        


    } catch (error) {
        console.error('error occured while adding product to the wishlist', error);
        res.redirect("/pageNotFound");
    }
}


const removeWishlist = async (req,res)=>{
    try {
        const userId = req.session.user;
        const productId = req.query.id;
        
        const userWishlist = await Wishlist.findOne({userId:userId});
        if(!userWishlist){
            return res.status(400).json({message:"Failed to fetch the userWishlist"});
        }

        const productExist = userWishlist.products.find(item=>{
            return item.productId.toString()===productId.toString();
        })
        if(productExist){
           await Wishlist.updateOne(
            {userId},
            {$pull:{products:{productId:productId}}});

            console.log("product removed from wishlist");
            
            return res.status(200).json({ message: "Product removed from wishlist" });
        }

    } catch (error) {
        console.error('error occured while removing product from wishlist', error);
        res.redirect("/pageNotFound");
    }
}





module.exports ={
    loadWishlist,
    addToWishlist,
    removeWishlist,
}