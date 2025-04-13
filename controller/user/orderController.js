const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Cart = require("../../model/cartSchema");
const Wishlist = require("../../model/wishlistSchema");
const Address = require("../../model/addressSchema");
const Order = require("../../model/orderSchema");
const Coupon = require("../../model/couponSchema");



const loadOrders = async (req, res) => {
    try {
        const userId = req.session.user;

        
        if (!userId) {
            return res.redirect('/login');
        }

        
        const userData = await User.findById(userId);
        if (!userData) {
            console.log("User data not found");
            return res.redirect('/login');
        }

        
        const userOrders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate("orderedItems.product")
            .lean(); // Optional: converts Mongoose docs to plain JS objects for better performance in templates

        res.render("user-Orders", {
            user: userData,
            orders: userOrders || []
        });

    } catch (error) {
        console.error("Error in loading user order list:", error);
        res.redirect("/pageNotFound");
    }
};


const loadOrderDetails = async (req,res)=>{
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login');
        }

        const userData = await User.findById(userId);
        if (!userData) {
            console.log("User data not found");
            return res.redirect('/login');
        }

        const orderId = req.query.id;
        if (!req.query.id) {
            console.log("Order ID missing from query");
            return res.redirect("/orders");
        }


        const orderDetails = await Order.findById(orderId).populate("orderedItems.product").lean();
        if(!orderDetails){
            console.log("order details not found");
            return;
        }

        res.render("orderDetails",{user:userData,order:orderDetails});
        
    } catch (error) {
        console.error("Error in loading order Details:", error);
        res.redirect("/pageNotFound");
    }
}






module.exports = {
    loadOrders,
    loadOrderDetails,
}