const User = require("../../model/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");



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
        console.error("failed to send mail via nodemailer:",error);
        return false;
    }
}


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log("error in hashing the password", error);

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
        console.log("something went wrong:",error);
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
        console.log("Something went wrong while checking the mail:",error);
        return res.status(500).json({ error: "Internal server Error" });
    }
}

// loading otp entering page
const loadOtpPage = async (req, res) => {
    try {
        res.render("passwordChgOTP");
    } catch (error) {
        console.log("something wrong while loading the otp page:",error);
        res.redirect('/pageNotFound');
    }
}

// otp verifying
const verifyPasswordChangeOtp = async (req, res) => {
    console.log("Received request body:", req.body);
    try {
        const { otpInput } = req.body;
        console.log("OTP received from frontend:", otpInput);
        console.log("Session OTP:", req.session.userOtp);

        if (otpInput === req.session.userOtp) {

            // Clear OTP from session after successful verification
            req.session.userOtp = null;

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



// load reset password page
const loadResetPassword = async (req, res) => {
    try {
        res.render("changePassword");
    } catch (error) {
        console.log("something went wrong while loading the loading the change password page:",error);
        res.redirect('/pageNotFound');
    }
}


// change password 
const resetPassword = async (req, res) => {
    try {
        console.log("entered reset password section");

        const password = req.body.password;
        const { email } = req.session;

        const userData = await User.findOne({ email });

        if (password) {
            console.log("email from session", email);

            console.log("password before hash:", password);
            const passwordHash = await securePassword(password);
            console.log("password after hash:", passwordHash);

            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                console.log("existing password(Old password)");
                return res.status(400).json({ message: "Please Enter a new password. This password is your current password." });

            }
            else {
                await User.updateOne({ email: email }, { $set: { password: passwordHash } });
                console.log("updated new password successfully");

                 // **Clear session data**
                 req.session.email = null;
                 req.session.userOtp = null;

                return res.status(200).json({ message: "Password Changed successfully.", redirectUrl: '/login' });
            }
        }



    } catch (error) {
        console.log("Something went wrong while changing the password to the database:",error);
        return res.status(500).json({ message: "Internal server error" });

    }

}



const clearSessionOtp = async (req, res) => {
    try {
        req.session.userOtp = "";
        console.log("Session otp is cleared");
        res.status(200).json({ message: "Cleared OTP from session, Please resend otp to continue" });
    } catch (error) {
        console.log("Error in occured while clearing the otp from session:",error);
        res.status(500).json({ message: "Internal server error" });
    }
}



const resendOTP = async (req, res) => {
    try {
        console.log("entered the resendotp"); //debugging 
        const email = req.session.email;

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            req.session.userOtp = otp;

            console.log("Resend Generated OTP:", otp);
            console.log("Resend Session OTP:", req.session.userOtp);


            return res.status(200).json({ message: " OTP is resend to your email:)" });
        } else {

            return res.status(400).json({ message: "Failed to resend OTP. Please try again" });

        }


    } catch (error) {

        console.log("Something went wrong while resending the otp: ",error);
        return res.status(500).json({ error: "Internal server Error" });

    }
}


module.exports = {
    getForgotPassPage,
    validateEmail,
    loadOtpPage,
    verifyPasswordChangeOtp,
    loadResetPassword,
    resetPassword,
    resendOTP,
    clearSessionOtp,
}