const User = require("../../model/userSchema");
const Address = require("../../model/addressSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

//otp generation
function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
 }



//  function to send a verification email with an OTP
async function sendVerificationEmail(email, otp) {
   try {

      
      const transporter = nodemailer.createTransport({
         service: 'gmail',  
         port: 587,         
         secure: false,    
         requireTLS: true, 
         auth: {
            user: process.env.NODEMAILER_EMAIL,   
            pass: process.env.NODEMAILER_PASSWORD, 
         }
      });

      
      const info = await transporter.sendMail({
         from: process.env.NODEMAILER_EMAIL, 
         to: email,  
         subject: "Kidify - Account Verification", 
         text: `Your OTP for account creation is ${otp}`, 
         html: `<b>Your OTP: ${otp}</b>`, 
      });

      
      return info.accepted.length > 0;

   } catch (error) {
      
      console.error("Error in sending email", error);
      return false; 
   }
}



 
//loading userprofile
const userProfile = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render('profile',{user:userData})
    } catch (error) {
        console.error('error for desplaying profile data',error);
        res.redirect("/pageNotFound");
    }  
        
}

//loading changeemail
const loadChangeEmail = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("changeEmail",{user:userData});
    } catch (error) {
        console.error('error for desplaying change email page',error);
        res.redirect("/pageNotFound");
    }
}


//loading user info edit page
const getEditProfile = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("edit-profile",{user:userData});

    } catch (error) {
        console.error('error for desplaying edit profile page',error);
        res.redirect("/pageNotFound");
    }
}

//otp generation and saving otp and new email in session
const ChangeEmail = async (req,res)=>{
    try {
        const userId = req.session.user;

        const {email:newEmail} = req.body;

        const googleUser = await User.findOne({$and:[{_id:userId},{googleId:{$exists:true}}]});

        if(googleUser){
            return res.status(400).json({message:"User who signin via google can't change the email"});
        }

        const otp = generateOtp();

        console.log(newEmail);
      const emailSent = await sendVerificationEmail(newEmail, otp);
      if (!emailSent) {
        return res.status(400).json({message:"error occured while sending otp to new email"});
     }

     req.session.userOtp = otp;
     req.session.newEmail = newEmail; 

     console.log("OTP sent to New mail:", otp);
     return res.status(200).json({message:"OTP Sent to your new email for verification",redirectUrl:'/verify-emailOtp'});

    } catch (error) {
        console.error('error occured while sending otp for email change:',error);
        res.redirect("/pageNotFound");
    }
    
}

const loadOtpPage = async (req,res)=>{
    try {
        if(req.session.userOtp && req.session.newEmail){
            res.render("email-otp-verification",{newMail:req.session.newEmail});
        }else{
            console.log("either otp or email is missing in the session");
            res.redirect("/userProfile");
        }
    } catch (error) {
        console.error('error occured while redirecting to otp verification page:',error);
        res.redirect("/pageNotFound");
    }
}

//verifying otp and updating the email
const verifyOtpEmail = async (req,res)=>{
    try {

        const userId = req.session.user;

        const newEmail = req.session.newEmail;
        
        const {otp:submittedOtp} = req.body;

        const generatedOTP = req.session.userOtp;

        if(submittedOtp!=generatedOTP){
            return res.status(400).json({message:"OTP don't match"});
        }

        if(submittedOtp===generatedOTP){

            const userUpdate = await User.findByIdAndUpdate(
                 userId,
                 {$set:{email:newEmail}},
                 {new:true}
            )

            if(!userUpdate){
                return res.status(400).json({message:"Failed to update the email"});
            }

            console.log("email updated as:",newEmail);

            req.session.userOtp=null;
            req.session.newEmail= null;


            return res.status(200).json({message:"OTP matched and Email Updated Successfully",redirectUrl:"/userProfile"})

        }


    } catch (error) {
        console.error('error occured while varifying and updating the email',error);
        res.redirect("/pageNotFound");
    }
}







module.exports={
    userProfile,
    loadChangeEmail,
    getEditProfile,
    ChangeEmail,
    loadOtpPage,
    verifyOtpEmail
}