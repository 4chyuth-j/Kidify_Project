const User = require("../../model/userSchema");
const Category = require("../../model/categorySchema");
const Product = require("../../model/productSchema");

const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");




//loading signup page
const loadSignup = async (req, res) => {
   try {
      return res.render('signup',{error_msg:""});

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
         return res.render("signup", { message: "Passwords don't match:(",error_msg:"" });
      }

      const findUser = await User.findOne({ email });
      if (findUser) {
         return res.render("signup", { message: "User with this email already exists",error_msg:"" });
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
      // console.log(req.body);


      if (otp === req.session.userOtp) {
         const user = req.session.userData;
         const passwordHash = await securePassword(user.password);

         const saveUserData = new User({
            email: user.email,
            password: passwordHash
         });

         await saveUserData.save();
         req.session.user = saveUserData._id;
         res.json({ success: true, redirectUrl: "/" });

      } else {
         res.status(400).json({ success: false, message: "Invalid OTP, Please try again" });
      }

   } catch (error) {
      console.error("Error in verifying otp", error);
      res.status(500).json({ success: false, message: "An error occured" });
   }
}


//resend otp
const resendOtp = async (req, res) => {
   try {
      const { email } = req.session.userData;
      if (!email) {
         return res.status(400).json({ success: false, message: "Email not found" });
      }

      const otp = generateOtp();
      req.session.userOtp = otp;

      const emailSent = await sendVerificationEmail(email, otp);
      if (emailSent) {
         console.log("Resend OTP:", otp);
         res.status(200).json({ success: true, message: "OTP resend successfully" });

      } else {
         res.status(500).json({ success: false, message: "failed to resend OTP, Please try again" });
      }

   } catch (error) {
      console.error("Error occured while resending OTP", error);
      res.status(500).json({ success: false, message: "Internal server error. Please try again" });

   }
}



//loading login page
const loadLogin = async (req, res) => {
   try {
      if(!req.session.user){
         return res.render('login');

      }else{
         res.redirect("/")
      }

   } catch (err) {
      res.redirect("pageNotFound");
      console.log("login page failed to load", err);
      res.status(500).send("server error");
   }
}

//login management
const login = async (req,res)=>{
   try {
      const {email,password} = req.body;
      const findUser = await User.findOne({email});

      if(!findUser){
         console.log("user is not present")
         return res.render("login",{message:"User not found"});
      }
      
      if(findUser.isBlocked){
         console.log("user blocked by admin");
         return res.render("login",{message:"User access blocked by admin"});
      }

      const passwordMatch = await bcrypt.compare(password,findUser.password);

      if(!passwordMatch){
         console.log("Wrong password");
         return res.render("login",{message:"Incorrect password"});
      }

      req.session.user = findUser._id;
      
      res.redirect("/");



   } catch (error) {

      console.log("login error",error);
      res.render("login",{message:"login failed. Please try again later"});
      
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

      const user = req.session.user;
      const categories = await Category.find({isListed:true});
      let productData = await Product.find(
         {isBlocked:false,
          category:{$in:categories.map(category=>category._id)},
          stock:{$gt:0},  
         }
      );

      productData.sort((a,b)=>new Date(b.createdAt) - new Date(a.createdAt));
      productData = productData.slice(0,4);



      if(user){
        
         const userData = await User.findOne({_id:user});
         
         res.render("home.ejs",{user:userData,products:productData});

      }else{

         return res.render("home.ejs",{products:productData});

      }

   } catch (error) {
      console.log("home page not found\n", error);
      res.status(500).send("servor error");
   }
};


const logout = async (req,res)=>{
   try {
      req.session.destroy((err)=>{
         if(err){
            console.log("session destruction error",err);
            return res.redirect("/pageNotFound");
         }
         
         return res.render("login",{successMessage:"LoggedOut successfully!"});

      })
      
   } catch (error) {
      console.log("logout error",error);
      res.redirect("/pageNotFound");
   }
}

const loadShopingPage = async (req,res)=>{
   try {
      const user = req.session.user;
      const userData = await User.findOne({_id:user});
      const categories = await Category.find({isListed:true});
      const categoryIds = categories.map(category=>category._id.toString());
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const skip = (page-1)*limit;
      const productBrands = await Product.find({isBlocked:false,
         category:{$in:categoryIds},
         stock:{$gt:0}
      });

      const brandAll = productBrands.map(product=>product.brand);
      const brand = [...new Set(brandAll)];

      const products = await Product.find({
         isBlocked:false,
         category:{$in:categoryIds},
         stock:{$gt:0},

      }).sort({createdAt:-1}).skip(skip).limit(limit);

      const totalProducts = await Product.countDocuments({
         isBlocked:false,
         category:{$in:categoryIds},
         stock:{$gt:0},

      });

      const totalPages = Math.ceil(totalProducts/limit);

      const categoriesWithIds = categories.map(category=>({_id:category._id,name:category.name}));

      res.render('shop',{
         user:userData,
         products:products,
         category:categoriesWithIds,
         brand:brand,
         totalProducts:totalProducts,
         currentPage:page,
         totalPages:totalPages,
      })
   } catch (error) {
      res.redirect("/pageNotFound");
   }
}

const filterProduct = async (req,res)=>{
   try {
      const user = req.session.user;
      const category = req.query.category;
      const brand = req.query.brand;

      const findCategory = category ? await Category.findOne({_id:category}) : null;
      const findBrand = brand? await Product.findOne({brand:brand}) :null;
      
      const query = {
         isBlocked:false,
         stock:{$gt:0},
      }

      if(findCategory){
         query.category = findCategory._id;
      }

      if(findBrand){
         query.brand = findBrand.brand;
      }

      let findProducts = await Product.find(query).lean();

      findProducts.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

      const categories = await Category.find({isListed:true});
      
      const productBrands = await Product.find({});
      const brands = [...new Set(productBrands.map(product=>product.brand))];
      

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage-1)*itemsPerPage;
      let endIndex = startIndex+itemsPerPage;
      let totalPages = Math.ceil(findProducts.length/itemsPerPage);
      const currentProduct = findProducts.slice(startIndex,endIndex);
      let userData = null;
      if(user){
         userData = await User.findOne({_id:user});
         if(userData){
            const searchEntry ={
               category: findCategory? findCategory._id : null,
               brand : findBrand? findBrand.brand : null,
               searchedOn : new Date()
            }
            userData.searchHistory.push(searchEntry);
            await userData.save();
         }
      }

      req.session.filteredProducts = currentProduct;

      res.render("shop",{
        user:userData,
        products:currentProduct,
        category:categories,
        brand:brands,
        totalPages,
        currentPage,
        selectedCategory:category || null,
        selectedBrand: brand || null,
        
      })

   } catch (error) {
      console.log("something went wrong while filtering product",error);
      res.redirect("/pageNotFound")
      
   }
}

const filterByPrice = async (req,res)=>{
   try {
      
      const user = req.session.user;
      const userData = await User.findOne({_id:user});
      const productBrands = await Product.find({}).lean();
      const categories = await Category.find({isListed:true}).lean();

      const brands = [...new Set(productBrands.map(product=>product.brand))];

      let findProducts = await Product.find({
         basePrice:{$gt:req.query.gt, $lt:req.query.lt},
         isBlocked:false,
         stock:{$gt:0},
      }).lean();

      findProducts.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage-1)*itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(findProducts.length/itemsPerPage);
      const currentProduct = findProducts.slice(startIndex,endIndex);
      req.session.filteredProducts = findProducts;
      res.render("shop",{
         user:userData,
         category:categories,
         products:currentProduct,
         brand:brands,
         totalPages,
         currentPage,

      });

   } catch (error) {
      console.log("something went wrong while filtering product price",error);
      res.redirect("/pageNotFound");
   }
}

const searchProducts = async (req,res)=>{
   try {
      const user=req.session.user;
      const userData = await User.findOne({_id:user});
      const productBrands = await Product.find({}).lean();
      const categories = await Category.find({isListed:true}).lean();      
      let search = req.body.query;
      const categoryIds = categories.map(category => category._id.toString());

      const brands = [...new Set(productBrands.map(product=>product.brand))];

      let searchResult = [];

      if(req.session.filteredProducts && req.session.filteredProducts.length>0){
         searchResult = req.session.filteredProducts.filter(product=>{
          return  product.productName.toLowerCase().includes(search.toLowerCase());
         })
      } else {

         searchResult = await Product.find({
            productName:{$regex:".*"+search+".*",$options:"i"},
            isBlocked:false,
            stock:{$gt:0},
            category:{$in:categoryIds}
         });

      }

     searchResult.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

     let itemsPerPage = 6;
     let currentPage = parseInt(req.query.page) || 1;
     let startIndex = (currentPage-1)*itemsPerPage;
     let endIndex = startIndex +itemsPerPage;
     let totalPages = Math.ceil(searchResult.length/itemsPerPage);
     const currentProduct = searchResult.slice(startIndex,endIndex);

     res.render("shop",{
      user:userData,
      products: currentProduct,
      category:categories,
      brand:brands,
      totalPages,
      currentPage,
      count:searchResult.length,

     })
      
      


   } catch (error) {
      console.log("something went wrong while searching products in shop page:",error);
      res.redirect("/pageNotFound");
   }
}






module.exports = {
   loadHomepage,
   pageNotFound,
   loadLogin,
   loadSignup,
   signup,
   verifyOtp,
   resendOtp,
   login,
   logout,
   loadShopingPage,
   filterProduct,
   filterByPrice,
   searchProducts,

}