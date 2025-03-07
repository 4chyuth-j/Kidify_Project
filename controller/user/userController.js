const User = require("../../model/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");




//loading signup page
const loadSignup = async (req, res) => {
   try {
      return res.render('signup');

   } catch (err) {
      console.log("Signup page failed to load", err);
      res.status(500).send("server error");
   }
}

//function for generating otp
function generateOtp() {
   return Math.floor(1000 + Math.random() * 9000).toString();
}


// Async function to send a verification email with an OTP
async function sendVerificationEmail(email, otp) {
   try {

      // Create a transporter object to handle sending emails
      const transporter = nodemailer.createTransport({
         service: 'gmail',  // Using Gmail as the email service
         port: 587,         // SMTP port for Gmail (587 is for TLS)
         secure: false,     // False because we are using TLS (not SSL)
         requireTLS: true,  // Ensures Transport Layer Security is used
         auth: {
            user: process.env.NODEMAILER_EMAIL,   // Your Gmail email (stored in environment variable)
            pass: process.env.NODEMAILER_PASSWORD, // Your Gmail app password (stored in environment variable)
         }
      });

      // Send the email using transporter.sendMail()
      const info = await transporter.sendMail({
         from: process.env.NODEMAILER_EMAIL, // Sender's email address
         to: email,  // Receiver's email address (user's email)
         subject: "Kidify - Account Verification",  // Email subject
         text: `Your OTP for account creation is ${otp}`, // Plain text version of the email
         html: `<b>Your OTP: ${otp}</b>`, // HTML version of the email (bold OTP)
      });

      // Check if the email was successfully sent (info.accepted contains successful recipients)
      return info.accepted.length > 0;

   } catch (error) {
      // Log any errors that occur while sending the email
      console.error("Error in sending email", error);
      return false; // Return false if there was an error
   }
}


// signup form data handling from front end
const signup = async (req, res) => {
   try {
      const { email, password, confirm_password } = req.body;

      if (password !== confirm_password) {
         return res.render("signup", { message: "Passwords don't match:(" });
      }

      const findUser = await User.findOne({ email });
      if (findUser) {
         return res.render("signup", { message: "User email already exists" });
      }

      const otp = generateOtp();


      console.log(email);
      const emailSent = await sendVerificationEmail(email, otp);
      if (!emailSent) {
         return res.json("email-error");
      }

      req.session.userOtp = otp;
      req.session.userData = { email, password };

      res.render("verify-otp");
      console.log("OTP sent to user:", otp);

   } catch (error) {
      console.error("sigup error occured", error);
      res.redirect("/pageNotFound");
   }
}

//password hashing
const securePassword = async (password) => {
   try {
      const passwordHash = await bcrypt.hash(password, 10);
      return passwordHash;
   } catch (error) {
      console.error("hashing failed", error);
   }
}




//otp verification and signup
const verifyOtp = async (req, res) => {
   try {
      const { otp } = req.body;
      // console.log("req.body otp=",otp);
      console.log(req.body);


      if (otp === req.session.userOtp) {
         const user = req.session.userData;
         const passwordHash = await securePassword(user.password);

         const saveUserData = new User({
            email: user.email,
            password: passwordHash
         });

         await saveUserData.save();
         req.session.user = saveUserData._id;
         res.json({success:true, redirectUrl:"/"});

      } else{
         res.status(400).json({success:false, message:"Invalid OTP, Please try again"});
      }

   } catch (error) {
          console.error("Error in verifying otp",error);
          res.status(500).json({success:false, message:"An error occured"});
   }
}


//loading login page
const loadLogin = async (req, res) => {
   try {
      return res.render('login');

   } catch (err) {
      console.log("login page failed to load", err);
      res.status(500).send("server error");
   }
}


const pageNotFound = async (req, res) => {
   try {
      res.render('page-404')

   } catch (error) {
      res.redirect("/pageNotFound");
   }
};



const loadHomepage = async (req, res) => {
   try {

      return res.render("home.ejs");

   } catch (error) {
      console.log("home page not found\n", error);
      res.status(500).send("servor error");
   }
};


module.exports = {
   loadHomepage,
   pageNotFound,
   loadLogin,
   loadSignup,
   signup,
   verifyOtp,
}