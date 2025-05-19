const User = require("../../model/userSchema");

const customerInfo = async (req, res) => {
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
            .sort({createdAt: -1})
            .exec();

        const count = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: ".*" + search + ".*", $options: "i" } },
                { email: { $regex: ".*" + search + ".*", $options: "i" } },
            ],
        }).countDocuments();

        res.render("customers", { 
            data: UserData, 
            totalPages: Math.ceil(count / limit), 
            currentPage: page,
            pageTitle: "Customers"
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
        res.redirect("/pageError");
    }
};

// For blocking user - Traditional way (still keep for backward compatibility)
const customerBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({_id: id}, {isBlocked: true});
        res.redirect("/admin/users");
    } catch (error) {
        console.log("Error occurred while blocking the user", error);
        res.status(500).send("Internal server error");
        res.redirect("/pageError");
    }
};

// For unblocking user - Traditional way (still keep for backward compatibility)
const customerUnblocked = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({_id: id}, {isBlocked: false});
        res.redirect("/admin/users");
    } catch (error) {
        console.log("Error occurred while Unblocking the user", error);
        res.status(500).send("Internal server error");
        res.redirect("/pageError");
    }
};

// For blocking user - AJAX way
const customerBlockedAjax = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({_id: id}, {isBlocked: true});
        
        // Return success response
        res.json({
            success: true,
            message: "User blocked successfully"
        });
    } catch (error) {
        console.log("Error occurred while blocking the user", error);
        res.status(500).json({
            success: false,
            message: "Error occurred while blocking the user"
        });
    }
};

// For unblocking user - AJAX way
const customerUnblockedAjax = async (req, res) => {
    try {
        let id = req.query.id;
        await User.updateOne({_id: id}, {isBlocked: false});
        
        // Return success response
        res.json({
            success: true,
            message: "User unblocked successfully"
        });
    } catch (error) {
        console.log("Error occurred while unblocking the user", error);
        res.status(500).json({
            success: false,
            message: "Error occurred while unblocking the user"
        });
    }
};

module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked,
    customerBlockedAjax,
    customerUnblockedAjax
};