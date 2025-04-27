const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Cart = require("../../model/cartSchema");
const Wishlist = require("../../model/wishlistSchema");
const Address = require("../../model/addressSchema");
const Order = require("../../model/orderSchema");
const Coupon = require("../../model/couponSchema");
const mongoose = require("mongoose");
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});



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

        const coupons = await Coupon.find({
            isList: true,
            maxUsage: { $gt: 0 },
            minimumPrice: { $lte: cartTotal },
            startOn: { $lte: new Date() },
            expireOn: { $gte: new Date() },
            $expr: {
                $lt: [{ $size: "$userId" }, "$maxUsage"]
            },
            userId: { $nin: [userId] },
        });


        res.render('checkout', {
            user: userData,
            address: userAddress,
            cart: userCart,
            cartTotal: cartTotal,
            coupons
        });
    } catch (error) {
        console.error("Error in loadCheckout:", error);
        res.redirect("/pageNotFound");
    }

};



const placeOrderOnlinePayment = async (req, res) => {
    try {

        const userId = req.session.user;
        const { addressId, paymentMethod, couponId } = req.body;

        const userData = await User.findById(userId);
        if (!userData) throw new Error("User not found");

        if (!addressId || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Address or payment method missing' });
        }

        const userCart = await Cart.findOne({ userId });
        if (!userCart || !userCart.items.length) throw new Error("Cart is empty or not found");

        const userAddresses = await Address.findOne({ userId });
        const selectedAddress = userAddresses?.address.find(addr => addr._id.toString() === addressId);
        if (!selectedAddress) throw new Error("Selected address not found");

        let totalPrice = userCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        let discount = 0;

        if (couponId) {
            const coupon = await Coupon.findById(couponId);
            if (!coupon) throw new Error("Coupon not found");
            discount = coupon.offerPrice || 0;
        }

        const finalAmount = totalPrice - discount;
        const amount = finalAmount * 100;

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: 'receipt_order_' + Date.now()
        };

        razorpayInstance.orders.create(options, (err, order) => {
            if (!err) {
                return res.status(200).send({
                    success: true,
                    msg: 'Order Created',
                    order_id: order.id,
                    amount: amount,
                    key_id: RAZORPAY_ID_KEY,
                    product_name: 'Kidify Cart Order',
                    description: 'Purchase from Kidify',
                    contact: selectedAddress.phone,
                    name: selectedAddress.name,
                    email: userData.email,
                    addressId,
                    couponId
                });
            } else {
                return res.status(400).send({ success: false, msg: 'Something went wrong!' });
            }
        });


    } catch (error) {
        console.log("Error in online payment:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to place order. Please try again.'
        });
    }
}




const verifyAndPlaceOrder = async (req,res)=>{
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId,
            couponId
        } = req.body;

        const userId = req.session.user;

        // Step 1: Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', RAZORPAY_SECRET_KEY)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        // Step 2: Place the order (same as your earlier logic)
        const userCart = await Cart.findOne({ userId });
        if (!userCart || !userCart.items.length) throw new Error("Cart is empty or not found");

        const userAddresses = await Address.findOne({ userId });
        const selectedAddress = userAddresses?.address.find(addr => addr._id.toString() === addressId);
        if (!selectedAddress) throw new Error("Selected address not found");

        let totalPrice = userCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        let discount = 0;

        if (couponId) {
            const coupon = await Coupon.findById(couponId);
            if (!coupon) throw new Error("Coupon not found");
            discount = coupon.offerPrice || 0;

            if (!coupon.userId.includes(userId)) {
                coupon.userId.push(userId);
                await coupon.save();
            }
        }

        const finalAmount = totalPrice - discount;

        const newOrder = new Order({
            userId,
            orderedItems: userCart.items.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
            totalPrice,
            discount,
            finalAmount,
            deliveryAddress: selectedAddress,
            paymentMethod: 'ONLINE',
            paymentStatus: 'Paid',
            orderStatus: 'Placed',
            couponApplied: couponId ? true : false,
           
        });

        await newOrder.save();


        await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    "walletHistory": {
                        amount: -finalAmount, 
                        type: 'purchase',
                        orderId: newOrder.orderId,
                        transactionId: razorpay_payment_id,
                        date: new Date(),
                        note: `Payment for order #${newOrder.orderId}`
                    }
                }
            }
        );

        for (const item of userCart.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
        }

        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

        await User.findByIdAndUpdate(userId, { $push: { orderHistory: newOrder._id } });

        return res.status(200).json({
            success: true,
            message: 'Order placed successfully',
            orderId: newOrder._id
        });

    } catch (error) {
        console.log("Error in varifyandPlaceOrder section:",error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}




const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { addressId, paymentMethod, couponId } = req.body;

        if (!addressId || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Address or payment method missing' });
        }

        const userData = await User.findById(userId);
        if (!userData) throw new Error("User Not Found");

        const userCart = await Cart.findOne({ userId });
        if (!userCart || !userCart.items.length) throw new Error("Cart is empty or not found");

        const userAddresses = await Address.findOne({ userId });
        const selectedAddress = userAddresses?.address.find(addr => addr._id.toString() === addressId);
        if (!selectedAddress) throw new Error("Selected address not found");

        let totalPrice = userCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        let discount = 0;

        if (couponId) {
            const coupon = await Coupon.findById(couponId);
            if (!coupon) throw new Error("Coupon not found");
            discount = coupon.offerPrice || 0;

            if (!coupon.userId.includes(userId)) {
                coupon.userId.push(userId);
                await coupon.save(); //  save the change made in coupon
            }
        }

        const finalAmount = totalPrice - discount;

        const newOrder = new Order({
            userId,
            orderedItems: userCart.items.map(item => ({
                product: item.productId,
                quantity: item.quantity,
                price: item.price,
            })),
            totalPrice,
            discount,
            finalAmount,
            deliveryAddress: selectedAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
            orderStatus: 'Placed',
            couponApplied: couponId ? true : false,
        });

        await newOrder.save();
        console.log("order placed ");

        for (const item of userCart.items) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
        }
        console.log("Stock count reduced");

        await Cart.findOneAndUpdate(
            { userId },
            { $set: { items: [] } }
        );
        console.log("Cart cleared");

        await User.findByIdAndUpdate(
            userId,
            { $push: { orderHistory: newOrder._id } }
        );
        console.log("Order history pushed");

        return res.status(200).json({
            success: true,
            message: 'Order placed successfully',
            orderId: newOrder._id
        });

    } catch (error) {
        console.error("Error in placeOrder:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to place order. Please try again.'
        });
    }
};


const loadPaymentFailed = async (req,res)=>{
    try {
        const userId = req.session.user;
        
        const userData = await User.findById(userId);

        if (!userData) {
            return res.redirect('/login');
        }

        res.render("paymentFailure", { user: userData });

    } catch (error) {
        console.error("Error in loading payment failure page:", error);
        res.redirect("/pageNotFound");
    }
}



const loadOrderSuccess = async (req, res) => {
    try {
        const userId = req.session.user;
        const orderId = req.query.id;

        const userData = await User.findById(userId);

        if (!userData) {
            return res.redirect('/login');
        }

        const orderData = await Order.findById(orderId);
        if (!orderData) {
            console.log("Failed to find orderData in db");
        }

        res.render("order-success", { user: userData, order: orderData });

    } catch (error) {
        console.error("Error in loading order success page:", error);
        res.redirect("/pageNotFound");
    }
}








module.exports = {
    loadCheckout,
    placeOrder,
    placeOrderOnlinePayment,
    verifyAndPlaceOrder,
    loadOrderSuccess,
    loadPaymentFailed,
}