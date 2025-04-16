const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Cart = require("../../model/cartSchema");
const Wishlist = require("../../model/wishlistSchema");
const Address = require("../../model/addressSchema");
const Order = require("../../model/orderSchema");
const Coupon = require("../../model/couponSchema");

const { generateInvoice } = require('../../helpers/pdfHelper');
const path = require('path');
const fs = require('fs-extra');



const loadOrders = async (req, res) => {
    try {
        const userId = req.session.user;

        const search = req.query.search || "";
        console.log("search query :", search);

        if (!userId) {
            return res.redirect('/login');
        }


        const userData = await User.findById(userId);
        if (!userData) {
            console.log("User data not found");
            return res.redirect('/login');
        }


        let userOrders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate("orderedItems.product")
            .lean(); // Optional: converts Mongoose docs to plain JS objects for better performance in templates

        if (search) {
            const lowerSearch = search.toLowerCase();
            
            userOrders = userOrders.filter((order) => {
                return (order.orderId.toLowerCase().includes(lowerSearch) ||
                    order.orderStatus.toLowerCase().includes(lowerSearch) ||
                    order.orderedItems.some(item =>
                        item.product.productName.toLowerCase().includes(lowerSearch)
                    ));
            })
        }

        res.render("user-Orders", {
            user: userData,
            orders: userOrders || []
        });

    } catch (error) {
        console.error("Error in loading user order list:", error);
        res.redirect("/pageNotFound");
    }
};


const loadOrderDetails = async (req, res) => {
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
        if (!orderDetails) {
            console.log("order details not found");
            return;
        }

        res.render("orderDetails", { user: userData, order: orderDetails });

    } catch (error) {
        console.error("Error in loading order Details:", error);
        res.redirect("/pageNotFound");
    }
}



const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.query.id;
        if (!orderId) {
            return res.status(400).send('Order ID is required');
        }

        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login');
        }

        // Find the order and populate product details
        const order = await Order.findById(orderId).populate("orderedItems.product").lean();
        console.log("order:", order);
        if (!order) {
            return res.status(404).send('Order not found');
        }


        // Create directory for invoices if it doesn't exist
        const invoicesDir = path.join(__dirname, '../public/invoices');
        await fs.ensureDir(invoicesDir);

        // Generate a unique filename
        const filename = `invoice-${order.orderId}-${Date.now()}.pdf`;
        const filePath = path.join(invoicesDir, filename);

        // Generate the PDF
        await generateInvoice(order, filePath);

        // Set headers for download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Stream the file to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // Delete the file after sending
        fileStream.on('close', () => {
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting temporary invoice file:', err);
            });
        });

    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).send('Error generating invoice');
    }
};


const cancelItem = async (req, res) => {
    try {
        const { orderId, productId, reason } = req.body;

        const orderDetails = await Order.findOne({ orderId }).populate("orderedItems.product");

        if (!orderDetails) {
            return res.status(404).send("Order not found");
        }

        
        const item = orderDetails.orderedItems.find(i => i.product._id.toString() === productId);

        if (!item) {
            return res.status(404).send("Product not found in the order");
        }

        const reStock = item.quantity;

        await Product.findOneAndUpdate(
            {_id:productId},
            {$inc:{stock:reStock}}
        );

        
        item.quantity = 0;
        item.price = 0;
        item.cancelled = true;
        item.cancelReason = reason;
        item.cancelledAt = new Date();

        // Recalculate total price
        let newTotal = 0;
        for (const i of orderDetails.orderedItems) {
            newTotal += i.quantity * i.price;
        }

        orderDetails.totalPrice = newTotal;
        orderDetails.finalAmount = newTotal;//discount not applied yet when the discount is applied change this 

        await orderDetails.save();

        const allCancelled = orderDetails.orderedItems.every(i=>i.cancelled);
        
        if(allCancelled){
          orderDetails.orderStatus = 'Cancelled';
          await orderDetails.save();
        }

        return res.status(200).json({ message: "Item cancelled successfully" });


    } catch (error) {
        console.error("Cancel item error:", error);
        return res.status(500).send("Server error");
    }
};



const returnOrder = async (req,res)=>{
    try {
        const {orderId,productId,returnReason}=req.body;

        const orderDetails = await Order.findOne({orderId}).populate("orderedItems.product");
        if(!orderDetails){
            console.log("order details for return is not found, orderId:",orderId);
            return res.status(404).json({message:"Something Went wrong with cart"});
        }

        const productTobeReturned = orderDetails.orderedItems.find(item=>
            item.product._id.toString()===productId.toString()
        );
        if(!productTobeReturned){
            console.log("failed to find product inside the order, ProductId:",productId);
            return res.status(404).json({message:"Failed to fetch the product Details"});
        }


        productTobeReturned.returnReason=returnReason;
        productTobeReturned.returnStatus='Pending';

        await orderDetails.save();
        return res.status(200).json({message:"Return requested"});
    } catch (error) {
        console.error("failed to send return request",error);
        res.status(500).json({ message: "Internal server error" });
    }
}








module.exports = {
    loadOrders,
    loadOrderDetails,
    downloadInvoice,
    cancelItem,
    returnOrder,
}