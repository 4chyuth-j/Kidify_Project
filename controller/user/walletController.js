const User = require("../../model/userSchema");

const loadWalletPage = async (req,res)=>{
    try {
        const userId = req.session.user;
        
        const userDetails = await User.findOne({_id:userId}).lean();

        if(!userDetails){
            console.log("User Details not found");
            return res.status(404).send("User not found");
        }

        res.render("wallet-Transaction",{user:userDetails,walletHistory:userDetails.walletHistory});


    } catch (error) {
        console.error("Error loading wallet page:", error);
        return res.status(500).send("Something went wrong");
    }
}

module.exports = {
    loadWalletPage,

}