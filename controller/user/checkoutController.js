const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Cart = require("../../model/cartSchema");
const Wishlist = require("../../model/wishlistSchema");
const Address = require("../../model/addressSchema");
const Order = require("../../model/orderSchema");
const Coupon = require("../../model/couponSchema");
const mongoose = require("mongoose");



const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        if (!userData) {
            return res.redirect('/login');
        }

        const userAddress = await Address.findOne({ userId });
        const userCart = await Cart.findOne({ userId }).populate('items.productId');

        if (!userCart || userCart.items.length === 0) {
            return res.redirect('/cart');
        }

        // Calculate totals
        const cartTotal = userCart.items.reduce((acc, item) => acc + item.totalPrice, 0);
        
        res.render('checkout', {
            user: userData, 
            address: userAddress, 
            cart: userCart,
            cartTotal: cartTotal
        });
    } catch (error) {
        console.error("Error in loadCheckout:", error);
        res.redirect("/pageNotFound");
    }

};




const placeOrder = async (req,res)=>{
    try {
        const userId = req.session.user;
        const {addressId,paymentMethod} = req.body;

        if(!addressId || !paymentMethod){
            return res.status(400).json({ 
                success: false, 
                message: 'Either addressId or paymentMethod is not received to backend' 
            });
        }

        const userData = await User.findById(userId);

        if(!userData){
            return res.status(400).json({ 
                success: false, 
                message: 'User Not Found' 
            });
        }

        const userCart = await Cart.findOne({userId});

        if(!userCart){
            return res.status(400).json({ 
                success: false, 
                message: 'Cart not found' 
            });
        }

        const userAddresses = await Address.findOne({userId});
        if(!userAddresses){
            return res.status(400).json({ 
                success: false, 
                message: 'User Addresses not found' 
            });
        }

        const selectedAddress = userAddresses.address.find(addr=>{
            return addr._id.toString()===addressId.toString()
        });
        if(!selectedAddress){
            return res.status(400).json({ 
                success: false, 
                message: 'Selected Address not found' 
            });
        }

        const totalPrice = userCart.items.reduce((curr,item)=>curr+item.totalPrice,0);

        const newOrder = new Order({
            userId,
            orderedItems:userCart.items.map(item=>({
                product:item.productId ,
                quantity:item.quantity ,
                price:item.price,
            
            })),
            totalPrice:totalPrice,
            finalAmount:totalPrice,
            deliveryAddress:selectedAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
            orderStatus: 'Placed'
        });

        await newOrder.save();
        console.log("order saved in db");


        for (const item of userCart.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }, // Reduce stock by item quantity
                { new: true }
            );
        }
        console.log("stock count reduced");
        

        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } }
        );
        console.log("cart cleared successfully");
        

        await User.findOneAndUpdate(
            {_id:userId},
            {$push:{orderHistory:newOrder._id}}
        );
        console.log("added order to order History");
        

        return res.status(200).json({ 
            success: true, 
            message: 'Order placed successfully',
            orderId: newOrder._id
        });



    } catch (error) {

        console.error("Error in placeOrder:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to place order. Please try again.' 
        });

    }
}



const loadOrderSuccess = async (req,res)=>{
    try {
        const userId = req.session.user;
        const orderId = req.query.id;

        const userData = await User.findById(userId);

        if (!userData) {
            return res.redirect('/login');
        }

        const orderData = await Order.findById(orderId);
        if(!orderData){
            console.log("Failed to find orderData in db");
        }

        res.render("order-success",{user:userData,order:orderData});

    } catch (error) {
        console.error("Error in loading order success page:", error);
        res.redirect("/pageNotFound");
    }
}








module.exports ={
    loadCheckout,
    placeOrder,
    loadOrderSuccess,
}