const User = require("../../model/userSchema");



const customerInfo = async (req, res)=>{
    try {

        let search = "";
        if (req.query.search) {
            search = req.query.search;
            
        }
        let page = 1;
        if (req.query.page) {
            page = req.query.page;
        }

        const limit = 6;
        const UserData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        }) 
            .skip((page - 1) * limit)
            .limit(limit * 1)
            .sort({createdAt:-1})
            .exec();


        const count = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*" , $options: "i"} },
                { email: { $regex: ".*" + search + ".*" , $options: "i"} },
            ],

        }).countDocuments();

        // console.log("UserData  fetched:", UserData); // ✅ Debugging step

        res.render("customers",{ 
            data: UserData, 
            totalPages: Math.ceil(count / limit), 
            currentPage: page ,
            pageTitle:"Customers"
        });


    } catch (error) {
       console.log(error);
       res.status(500).send("Internal server error");
       res.redirect("/pageError");
    }
}



//for blocking user
const customerBlocked = async (req,res)=>{
    try {
        let id= req.query.id;
        await User.updateOne({_id:id},{isBlocked:true});
        res.redirect("/admin/users");

    } catch (error) {
        console.log("Error occured while blocking the user",error);
        res.status(500).send("Internal server error");
        res.redirect("/pageError");
    }
}

//for unblocking user
const customerUnblocked = async (req,res)=>{
    try {
        let id= req.query.id;
        await User.updateOne({_id:id},{isBlocked:false});
        res.redirect("/admin/users");

    } catch (error) {
        console.log("Error occured while Unblocking the user",error);
        res.status(500).send("Internal server error");
        
    }
}



module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked
}