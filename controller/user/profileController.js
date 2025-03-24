const User = require("../../model/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");


async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,

            }

        });

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Your otp for password change",
            text: `Your otp for password change is ${otp}`,
            html: `<b><h4>Your OTP:${otp}</h4></b>`,
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.messageId);
        return true;


    } catch (error) {
        console.error("failed to send mail via nodemailer");
        return false;
    }
}


function generateOtp() {
    const digits = "1234567890";
    let otp = "";
    for (let i = 0; i < 4; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }

    return otp;
}




const getForgotPassPage = async (req, res) => {
    try {
        res.render("forgotPassword");

    } catch (error) {

        res.redirect('/pageNotFound');

    }
}

const validateEmail = async (req, res) => {
    try {
        const { email } = req.body;

        const emailExists = await User.findOne({ email: email, googleId: { $exists: false } });

        if (!emailExists) {
            return res.status(400).json({ error: "User not found. Please check wheather the email is correct." });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            req.session.userOtp = otp;
            req.session.email = email;


            console.log("Generated OTP:", otp);
            console.log("Session OTP:", req.session.userOtp);


            return res.status(200).json({ message: "Email matched Successfully. OTP is sent to your mail:)" });
        } else {
            return res.status(400).json({ error: "Failed to send OTP. Please try again" });

        }

    } catch (error) {
        console.log("Something went wrong while checking the mail ");
        return res.status(500).json({ error: "Internal server Error" });
    }
}


const loadOtpPage = async (req, res) => {
    try {
        res.render("passwordChgOTP");
    } catch (error) {
        res.redirect('/pageNotFound');
    }
}

const verifyPasswordChangeOtp = async (req, res) => {
    console.log("Received request body:", req.body);
    try {
        const { otpInput } = req.body;
        console.log("OTP received from frontend:", otpInput);
        console.log("Session OTP:", req.session.userOtp);

        if (otpInput === req.session.userOtp) {
            console.log("OTP matched");
            return res.status(200).json({ 
                success: true,
                message: "OTP matched Successfully", 
                redirectUrl: '/reset-Password' 
            });
        } else {
            console.log("OTP didn't match");
            return res.status(400).json({ 
                success: false,
                error: "OTP not matching, try again!" 
            });
        }
    } catch (error) {
        console.error("Error in OTP verification:", error);
        return res.status(500).json({ 
            success: false,
            error: "Internal Server error, Please try again" 
        });
    }
}




const loadResetPassword = async (req, res) => {
    try {
        res.render("changePassword");
    } catch (error) {
        res.redirect('/pageNotFound');
    }
}



module.exports = {
    getForgotPassPage,
    validateEmail,
    loadOtpPage,
    verifyPasswordChangeOtp,
    loadResetPassword
}