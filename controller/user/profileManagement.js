const User = require("../../model/userSchema");
const Address = require("../../model/addressSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");


//otp generation
function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
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
const userProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render('profile', { user: userData })
    } catch (error) {
        console.error('error for desplaying profile data', error);
        res.redirect("/pageNotFound");
    }

}

//loading changeemail
const loadChangeEmail = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("changeEmail", { user: userData });
    } catch (error) {
        console.error('error for desplaying change email page', error);
        res.redirect("/pageNotFound");
    }
}


//loading user info edit page
const getEditProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("edit-profile", { user: userData });

    } catch (error) {
        console.error('error for desplaying edit profile page', error);
        res.redirect("/pageNotFound");
    }
}

//otp generation and saving otp and new email in session
const ChangeEmail = async (req, res) => {
    try {
        const userId = req.session.user;

        const { email: newEmail } = req.body;

        const googleUser = await User.findOne({ $and: [{ _id: userId }, { googleId: { $exists: true } }] });

        if (googleUser) {
            return res.status(400).json({ message: "User who signin via google can't change the email" });
        }

        const otp = generateOtp();

        console.log(newEmail);
        const emailSent = await sendVerificationEmail(newEmail, otp);
        if (!emailSent) {
            return res.status(400).json({ message: "error occured while sending otp to new email" });
        }

        req.session.userOtp = otp;
        req.session.newEmail = newEmail;

        console.log("OTP sent to New mail:", otp);
        return res.status(200).json({ message: "OTP Sent to your new email for verification", redirectUrl: '/verify-emailOtp' });

    } catch (error) {
        console.error('error occured while sending otp for email change:', error);
        res.redirect("/pageNotFound");
    }

}

const loadOtpPage = async (req, res) => {
    try {
        if (req.session.userOtp && req.session.newEmail) {
            res.render("email-otp-verification", { newMail: req.session.newEmail });
        } else {
            console.log("either otp or email is missing in the session");
            res.redirect("/userProfile");
        }
    } catch (error) {
        console.error('error occured while redirecting to otp verification page:', error);
        res.redirect("/pageNotFound");
    }
}

//verifying otp and updating the email
const verifyOtpEmail = async (req, res) => {
    try {

        const userId = req.session.user;

        const newEmail = req.session.newEmail;

        const { otp: submittedOtp } = req.body;

        const generatedOTP = req.session.userOtp;

        if (submittedOtp != generatedOTP) {
            return res.status(400).json({ message: "OTP don't match" });
        }

        if (submittedOtp === generatedOTP) {

            const userUpdate = await User.findByIdAndUpdate(
                userId,
                { $set: { email: newEmail } },
                { new: true }
            )

            if (!userUpdate) {
                return res.status(400).json({ message: "Failed to update the email" });
            }

            console.log("email updated as:", newEmail);

            req.session.userOtp = null;
            req.session.newEmail = null;


            return res.status(200).json({ message: "OTP matched and Email Updated Successfully", redirectUrl: "/userProfile" })

        }


    } catch (error) {
        console.error('error occured while varifying and updating the email', error);
        res.redirect("/pageNotFound");
    }
}

//profile edit 
const editProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        const { name, phone } = req.body;

        const userExist = await User.findOne({ _id: userId });

        if (!userExist) {
            return res.status(400).json({ message: "user don't exist" });
        }

        const userUpdate = await User.findByIdAndUpdate(
            userId,
            { $set: { name: name, phone: phone } },
            { new: true }
        );

        if (!userUpdate) {
            return res.status(400).json({ message: "Failed to update the changes" })
        }

        return res.status(200).json({ message: "Successfully updated profile info", redirectUrl: '/userProfile' });

    } catch (error) {
        console.error('error occured while updating user profile', error);
        res.redirect("/pageNotFound");

    }
}



const loadChangePassword = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        if (!userData) {
            console.log("User not found to change the password");
            return res.redirect("/pageNotFound");
        }


        const otp = generateOtp();

        if (!otp) {
            console.log("OTP generation failed");
            return res.redirect("/pageNotFound");
        }

        const email = userData.email;

        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            console.log("error occured while sending otp to new email");
            return res.redirect("/pageNotFound");
        }

        req.session.userOtp = otp;

        console.log("OTP for password change:", otp);

        if (req.session.userOtp) {

            res.render("userPassword-changeOTP", { user: userData });

        }

    } catch (error) {

        console.error('error occured while loading password change page', error);
        res.redirect("/pageNotFound");

    }
}


const otpVerificationChangePassword = async (req, res) => {
    try {
        const { otp: enterOtp } = req.body;
        const otp = req.session.userOtp;

        if (otp != enterOtp) {
            return res.status(400).json({ message: "OTP don't match. Please try again" });
        }

        req.session.userOtp = null;

        return res.status(200).json({ message: "OTP verification successfull", redirectUrl: '/setNewPassword' });



    } catch (error) {
        console.error('error occured while verifying otp for changing password', error);
        res.redirect("/pageNotFound");
    }
}



const loadSetPassword = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("set-newPassword",{user:userData});
    } catch (error) {
        console.error('error occured while loading new password page', error);
        res.redirect("/pageNotFound");
    }
}

const SetPassword = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const { newPassword, confirmPassword } = req.body;

        if (newPassword != confirmPassword) {
            return res.status(400).json({ message: "Password don't match match" });
        }

        const passwordMatch = await bcrypt.compare(newPassword,userData.password);

        if(passwordMatch){
            return res.status(400).json({message:"Please try a new password. This is your current password!"});
        }
        
        const passwordHash = await securePassword(newPassword);
        
        if(!passwordHash){
            return res.status(400).json({message:"Password hashing failed. Please try later"});
            
        }
        
        const setNewPassword = await User.findByIdAndUpdate(
            userId,
            {$set:{password:passwordHash}},
            {new:true}
        );
        
        if(!setNewPassword){
            return res.status(400).json({message:"Failed to change the password. Please try later"});

        }

        return res.status(200).json({message:"Password Changed Successfully",redirectUrl:'/userProfile'});


    } catch (error) {

        console.error('error occured while changing the password', error);
        res.redirect("/pageNotFound");

    }
}




const loadAddressManagement = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const userAddress = await Address.findOne({userId: userId});
        
        const addresses=userAddress? userAddress.address: [];
        res.render("user-addresses",{addresses:addresses,user:userData});
    } catch (error) {
        console.error('error occured while loading address', error);
        res.redirect("/pageNotFound");
    }
}


const loadAddAddress = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("add-address",{user:userData});
    } catch (error) {
        console.error('error occured while loading add address', error);
        res.redirect("/pageNotFound");
    }
}


const addAddress = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const {addressType,name,phone,altPhone,landMark,city,state, pincode} = req.body;

        const userAddress = await Address.findOne({userId:userId});
        if(!userAddress){
            const newAddress = new Address({
                userId: userData._id,
                address:[{addressType,name,phone,altPhone,landMark,city,state, pincode}],
            });
            await newAddress.save();
            return res.status(200).json({message:"Addresses added successfully"});
        } else {
            userAddress.address.push({addressType,name,phone,altPhone,landMark,city,state, pincode});
            await userAddress.save();
            return res.status(200).json({message:"Addresses added successfully"});
        }
        
    } catch (error) {
        console.error('error occured while adding address in db', error);
        res.redirect("/pageNotFound");
    }
}



const getEditAddress = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const addressId = req.query.id;

        const currentAddress = await Address.findOne({
            "address._id":addressId,
        })

        if(!currentAddress){
            console.log("address not found");
            return res.redirect("/pageNotFound");
        }

        const addressData = currentAddress.address.find((item)=>{
            return item._id.toString()===addressId.toString()
        })

        if(!addressData){
            console.log("address data not found");
            return res.redirect("/pageNotFound");
        }

        res.render("edit-address",{address:addressData,user:userData});

    } catch (error) {
        console.error('error occured while loading edit address', error);
        res.redirect("/pageNotFound");
    }
}


const editAddress = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        if(!userData){
            console.log("failed to get the userData");
            return res.status(400).json({message:"User data don't exist"});
            
        }
        const {addressId,addressType,name,phone,altPhone,landMark,city,state, pincode} = req.body;
        const userAddress = await Address.findOne({userId:userId});
        if(!userAddress){
            console.log("user address not found");
            return res.status(400).json({message:"User address don't exist"});
        }
        
        const addressIndex = userAddress.address.findIndex(item=>{
            return item._id.toString() === addressId.toString();
        });
        
        if(addressIndex ==-1){
            console.log("Required address don't exist in the collection");
            return res.status(400).json({message:"User address don't exist"});
        }

        userAddress.address[addressIndex].addressType = addressType;
        userAddress.address[addressIndex].name = name;
        userAddress.address[addressIndex].phone = phone;
        userAddress.address[addressIndex].altPhone = altPhone;
        userAddress.address[addressIndex].landMark = landMark;
        userAddress.address[addressIndex].city = city;
        userAddress.address[addressIndex].state = state;
        userAddress.address[addressIndex].pincode = pincode;

        await userAddress.save();
        res.status(200).json({message:"Address edited and Updated Successfully"});

    } catch (error) {
        console.error('error occured while editting address', error);
        res.redirect("/pageNotFound");
    }
}


const deleteAddress = async (req,res)=>{
    try {
        const userId = req.session.user;
        const addressId = req.query.id;
        

        const userAddress = await Address.findOne({userId:userId});
        if(!userAddress){
            console.log("User address not found for deleting ");
            return res.status(400).json({message:"Address not found"});
        }

        //or we can use $pull method in update to remove the address

        // await Address.updateOne({ userId: userId },
        //     { $pull: { address: { _id: addressId } } });

        userAddress.address = userAddress.address.filter(
            (item)=> { 
                return item._id.toString()!== addressId.toString()
            }
        );

        await userAddress.save();

        console.log("Address deleted successfully");
        
        return res.status(200).json({ message: "Address deleted successfully" }); 

    } catch (error) {
        console.error('error occured while deleting address', error);
        res.redirect("/pageNotFound");
    }
}


module.exports = {
    userProfile,
    loadChangeEmail,
    getEditProfile,
    ChangeEmail,
    loadOtpPage,
    verifyOtpEmail,
    loadChangePassword,
    otpVerificationChangePassword,
    loadSetPassword,
    SetPassword,
    editProfile,
    loadAddressManagement,
    loadAddAddress,
    addAddress,
    getEditAddress,
    editAddress,
    deleteAddress,
    
}