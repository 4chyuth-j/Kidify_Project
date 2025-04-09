const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Cart = require("../../model/cartSchema");
const Wishlist = require("../../model/wishlistSchema");


const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId, quantity } = req.body;

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

            console.log("Product added to cart");
            return res.status(200).json({ message: "Product added to cart successfully" });

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
        
        return res.status(200).json({ message: "Product added to cart successfully", totalPrice });

    } catch (error) {

        console.error("Error adding to cart:", error);
        return res.status(500).json({ message: "Something went wrong. Please try again later." });

    }
};







module.exports = {
    addToCart,
}