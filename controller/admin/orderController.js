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
                'deliveryAddress.name':{ $regex: ".*" + search + ".*", $options: "i" },
                orderId:{ $regex: ".*" + search + ".*", $options: "i" }
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




module.exports ={
    loadOrders,
}