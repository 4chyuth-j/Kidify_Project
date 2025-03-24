const User = require("../../model/userSchema");





const getForgotPassPage = async (req,res)=>{
    try {
        res.render("forgotPassword");

    } catch (error) {

        res.redirect('/pageNotFound');
        
    }
}

const validateEmail = async (req,res)=>{
    try {
        const {email} = req.body;

        const emailExists = await User.findOne({email:email, googleId:{$exists:false}});

        if(!emailExists){
            return res.status(400).json({error:"User not found. Please check wheather the email is correct."});
        }

        return res.status(200).json({message:"Email matched Successfully."})
    } catch (error) {
        console.log("Something went wrong while checking the mail ");
        return res.status(500).json({ error: "Internal server Error" });
    }
}


const loadOtpPage = async (req,res)=>{
    try {
        res.render("forgotPassword");
    } catch (error) {
        res.redirect('/pageNotFound');
    }
}







module.exports={
    getForgotPassPage,
    validateEmail,
    loadOtpPage,
}