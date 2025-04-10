const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Cart = require("../../model/cartSchema");
const Wishlist = require("../../model/wishlistSchema");


const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId, quantity } = req.body;
        
        const userWishlist = await Wishlist.findOne({userId:userId}).populate('products.productId');
        // console.log("userWishlist",userWishlist);
        // console.log("\n \n userWishlist.products:",userWishlist.products);
        
        console.log("productId:" + productId + " quantity:", quantity);
        
        const productData = await Product.findOne({ _id: productId });
        
        if (!productData) {
            return res.status(400).json({ message: "Product doesn't exist" });
        }
        
        const basePrice = productData.basePrice;
        const discountPercentage = productData.discountPercentage;
        const stock = productData.stock;
        
        if (quantity > stock || stock === 0) {
            
            console.log("stock limit");
            return res.status(400).json({ message: `Only ${stock} left in stock. Please adjust quantity.` });
        }
        
        const price = Math.round(basePrice - (basePrice * discountPercentage) / 100);
        const totalPrice = price * quantity;
        
        const productExistInWishlist = userWishlist?.products.find(product => {
            return product.productId._id.toString() === productId.toString();
        });
        // console.log("productExistinwishlist: ",productExistInWishlist);
          

        const userCart = await Cart.findOne({ userId });

        if (!userCart) {
            const newCart = new Cart({
                userId,
                items: [{
                    productId,
                    quantity,
                    price,
                    totalPrice,
                }]
            });
            await newCart.save();


            if(productExistInWishlist){
                await Wishlist.updateOne({userId},{$pull:{products:{productId:productId}}});
                console.log("product removed from wishlist");
            }

            console.log("Product added to cart");
            return res.status(200).json({ message: "Product added to cart successfully" });

        }

        if(productExistInWishlist){
            await Wishlist.updateOne({userId},{$pull:{products:{productId:productId}}});
            console.log("product removed from wishlist");
        }

        const productExist = userCart.items.find(item => {
            return item.productId.toString() === productId.toString();
        });

        if (productExist) {
            console.log("Product already exist in cart");
            return res.status(200).json({ message: "Product already in Cart" });
        }

        userCart.items.push({
            productId,
            quantity,
            price,
            totalPrice
        });

        await userCart.save();

        console.log("Product added to cart");
        
        return res.status(200).json({ message: "Product added to cart successfully" });

    } catch (error) {

        console.error("Error adding to cart:", error);
        res.redirect("/pageNotFound");

    }
};





const loadCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId).lean(); // Use .lean() for better performance with templates

        
        const cart = await Cart.findOne({ userId }).populate('items.productId').lean();

        res.render("userCart", { user: userData, cart });
    } catch (error) {
        console.error("Error loading cart:", error);
        res.redirect("/pageNotFound");
    }
};


const removeCartProduct = async (req, res) => {
    try {
        const userId = req.session.user;
        const itemId = req.query.id;
        

        
        const userCart = await Cart.findOne({ userId });

        if (!userCart) {
            return res.status(400).json({ message: "User cart doesn't exist" });
        }

        
        const productExists = userCart.items.find(item => {
            
            return item._id.toString() === itemId.toString()});

        if (!productExists) {
            return res.status(400).json({ message: "Product doesn't exist in cart" });
        }

        
        await Cart.updateOne(
            { userId },
            { $pull: { items: { _id: itemId } } }
        );

        return res.status(200).json({ message: "Product removed successfully" });

    } catch (error) {
        console.error("Error removing product from cart:", error);
        res.redirect("/pageNotFound");
    }
};








module.exports = {
    addToCart,
    loadCart,
    removeCartProduct,
}