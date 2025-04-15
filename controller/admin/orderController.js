const User = require("../../model/userSchema");
const Order = require("../../model/orderSchema");


const loadOrders = async (req,res)=>{
    try {

        const search = req.query.search || "";
        const page = req.query.page || 1;
        console.log("search:",search);
        
        const limit = 7;

        let query = {};
        if(search){
            query={
                $or:[
                    {'deliveryAddress.name':{ $regex: ".*" + search + ".*", $options: "i" }},
                    {orderId:{ $regex: ".*" + search + ".*", $options: "i" }}
                ]
            }
        }

        
        const userOrders = await Order.find(query).skip((page-1)*limit).limit(limit).sort({createdAt:-1}).exec();
        

        const count = await Order.find(query).countDocuments();

        res.render("orders",{ 
            orders: userOrders, 
            totalPages: Math.ceil(count / limit), 
            currentPage: page ,
            pageTitle:"Orders"
        });
        
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
}




const loadOrderDetails = async (req, res) => {
    try {
      const orderId = req.query.id;
  
      if (!orderId) {
        return res.status(400).send("Order ID is required");
      }
  
      const orderDetails = await Order.findOne({ _id: orderId })

        .populate("orderedItems.product")
        .lean();
  
      if (!orderDetails) {
        return res.status(404).send("Order not found");
      }
  
      res.render("admin-orderDetails", {
        order: orderDetails,
        pageTitle: "Order Details"
      });
      
    } catch (error) {
      console.error("Error loading order details:", error);
      res.status(500).send("Server Error");
    }
  };
  

  const updateOrderStatus = async (req, res) => {
    try {
      const { orderId, orderStatus } = req.body;
  
      const orderDetails = await Order.findOne({ orderId });
  
      if (!orderDetails) {
        return res.status(400).json({ success: false, message: 'Failed to find Order Details' });
      }
  
      if (orderDetails.orderStatus === orderStatus) {
        return res.status(400).json({
          success: false,
          message: `Order is already marked as "${orderStatus}". No changes made.`
        });
      }
      
      const statusFlow = ['Placed', 'Processing', 'Shipped', 'Delivered'];
  
      const currentIndex = statusFlow.indexOf(orderDetails.orderStatus);
      const newIndex = statusFlow.indexOf(orderStatus);
  
      //  Prevent going backward in status
      if (newIndex < currentIndex ) {
        return res.status(400).json({
          success: false,
          message: `Invalid status update. Cannot change status from "${orderDetails.orderStatus}" to "${orderStatus}".`
        });
      }
  
      const updateFields = { orderStatus };
  
      // If COD and Delivered, mark payment as Paid
      if (orderDetails.paymentMethod === 'COD' && orderStatus === 'Delivered') {
        updateFields.paymentStatus = 'Paid';
        updateFields.deliveredAt = new Date();
      }
  
      await Order.findOneAndUpdate({ orderId }, updateFields);
  
      return res.status(200).json({ success: true, message: 'Order status updated successfully!' });
  
    } catch (err) {
      console.error("Error in updating order Status", err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  

















module.exports ={
    loadOrders,
    loadOrderDetails,
    updateOrderStatus
}