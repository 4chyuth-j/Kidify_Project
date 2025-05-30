const User = require("../../model/userSchema");
const Category = require("../../model/categorySchema");
const Product = require("../../model/productSchema");

const nodemailer = require("nodemailer");

const bcrypt = require("bcrypt");




//loading signup page
const loadSignup = async (req, res) => {
   try {
      return res.render('signup', { error_msg: "" });

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

      const { email, password, confirm_password, referralCode } = req.body;

      if (password !== confirm_password) {
         return res.status(400).json({ message: "Passwords don't match :(" });
         // return res.render("signup", { message: "Passwords don't match:(", error_msg: "" });
      }

      const findUser = await User.findOne({ email });
      if (findUser) {

         return res.status(400).json({ message: "User with this email already exists" });
         // return res.render("signup", { message: "User with this email already exists", error_msg: "" });
      }
      if (referralCode) {

         const validateReferralCode = await User.findOne({ referralCode: referralCode });
         if (!validateReferralCode) {
            return res.status(400).json({ message: "Invalid referral code. Please check the code" });
         }

      }

      const otp = generateOtp();


      console.log(email);
      const emailSent = await sendVerificationEmail(email, otp);
      if (!emailSent) {
         return res.status(400).json({ message: "error occured while sending email" });
      }

      req.session.userOtp = otp;
      req.session.userData = { email, password };
      if (referralCode) {
         req.session.referralCode = referralCode;
      }

      console.log("OTP sent to user:", otp);
      return res.status(200).json({ message: "OTP Sent to your mail", redirectUrl: '/verify-otp' });

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

const getverifyOtp = async (req, res) => {
   try {
      const otp = req.session.userOtp;
      if (otp) {
         res.render("verify-otp");
      } else {
         console.log("OTP expired or missing");
         res.redirect("/signup");
      }
   } catch (error) {
      console.error("Error occurred while loading the OTP verification page:", error);
      res.redirect("/pageNotFound");
   }
};


//otp verification and signup
const verifyOtp = async (req, res) => {
   try {

      const REFERRAL_REWARD = Number(process.env.REFERRAL_REWARD);
      const MAX_REFERRAL_EARNINGS = Number(process.env.MAX_REFERRAL_EARNINGS);


      if (!REFERRAL_REWARD || !MAX_REFERRAL_EARNINGS) {
         return res.status(500).json({ success: false, message: "Referral reward settings not configured correctly." });
      }


      const { otp } = req.body;
      // console.log("req.body otp=",otp);
      // console.log(req.body);

      const referralCode = req.session.referralCode || null;


      if (otp === req.session.userOtp) {
         const user = req.session.userData;
         const passwordHash = await securePassword(user.password);

         const emailName = user.email.split('@')[0];                     // e.g., "achyuthj2002"
         const filteredName = emailName.replace(/[^a-zA-Z]/g, '');       // remove numbers and symbols
         const capitalizedName = filteredName.charAt(0).toUpperCase() + filteredName.slice(1); // "Achyuthj"

         const saveUserData = new User({
            name:capitalizedName,
            email: user.email,
            password: passwordHash,
            referredBy: referralCode
         });

         await saveUserData.save();
         req.session.user = saveUserData._id;

         // If user entered a referral code, reward the referrer
         if (referralCode) {
            const referringUser = await User.findOne({ referralCode: referralCode });

            if (referringUser) {
               if (referringUser.referralEarnings < MAX_REFERRAL_EARNINGS) {

                  let reward = REFERRAL_REWARD;

                  if (referringUser.referralEarnings + REFERRAL_REWARD > MAX_REFERRAL_EARNINGS) {
                     reward = MAX_REFERRAL_EARNINGS - referringUser.referralEarnings;
                  }

                  referringUser.wallet += reward;
                  referringUser.referralEarnings += reward;

                  referringUser.walletHistory.push({
                     amount: reward,
                     type: 'referral-reward',
                     date: new Date(),
                     note: `Reward for referring user ${saveUserData._id.toString().slice(0, 6)}`
                  });

                  await referringUser.save();
               }
            }
         }

         req.session.userOtp = null;
         req.session.referralCode = null;

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
      if (!req.session.user) {
         return res.render('login', {
            message: "", // Empty unless you want to pass something
            successMessage: ""
         });

      } else {
         res.redirect("/")
      }

   } catch (err) {
      res.redirect("pageNotFound");
      console.log("login page failed to load", err);
      res.status(500).send("server error");
   }
}

//login management
const login = async (req, res) => {
   try {
      const { email, password } = req.body;
      const findUser = await User.findOne({ email });

      if (!findUser) {
         console.log("user is not present")
         return res.render("login", { message: "User not found" });
      }

      if (findUser.isBlocked) {
         console.log("user blocked by admin");
         return res.render("login", { message: "User access blocked by admin" });
      }

      const passwordMatch = await bcrypt.compare(password, findUser.password);

      if (!passwordMatch) {
         console.log("Wrong password");
         return res.render("login", { message: "Incorrect password" });
      }

      req.session.user = findUser._id;

      res.redirect("/");



   } catch (error) {

      console.log("login error", error);
      res.render("login", { message: "login failed. Please try again later" });

   }
}


const pageNotFound = async (req, res) => {
   try {
      res.render('page-404')

   } catch (error) {
      console.log("failed to load the error page:", error);
      res.redirect("/pageNotFound");
   }
};



const loadHomepage = async (req, res) => {
   try {

      const user = req.session.user;
      const categories = await Category.find({ isListed: true });
      let productData = await Product.find(
         {
            isBlocked: false,
            category: { $in: categories.map(category => category._id) },
            stock: { $gt: 0 },
         }
      );

      productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      productData = productData.slice(0, 4);



      if (user) {

         const userData = await User.findOne({ _id: user });

         res.render("home.ejs", { user: userData, products: productData });

      } else {

         return res.render("home.ejs", { products: productData });

      }

   } catch (error) {
      console.log("home page not found\n", error);
      res.status(500).send("servor error");
   }
};


const logout = async (req, res) => {
   try {
      req.session.destroy((err) => {
         if (err) {
            console.log("session destruction error", err);
            return res.redirect("/pageNotFound");
         }

         return res.render("login", { successMessage: "LoggedOut successfully!" });

      })

   } catch (error) {
      console.log("logout error", error);
      res.redirect("/pageNotFound");
   }
}



const loadShopingPage = async (req, res) => {
   try {
      const user = req.session.user;
      const userData = await User.findOne({ _id: user });
      const categories = await Category.find({ isListed: true });
      const categoryIds = categories.map(category => category._id.toString());
      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;

      const sortOption = req.query.sort || 'new-arrivals';

      const productBrands = await Product.find({
         isBlocked: false,
         category: { $in: categoryIds },
         stock: { $gt: 0 }
      });

      const brandAll = productBrands.map(product => product.brand);
      const brand = [...new Set(brandAll)];

      // Define the sort query based on the sortOption
      let sortQuery = {};
      switch (sortOption) {
         case 'price-low-to-high':
            sortQuery = { basePrice: 1 };
            break;
         case 'price-high-to-low':
            sortQuery = { basePrice: -1 };
            break;
         case 'a-z':
            sortQuery = { productName: 1 };
            break;
         case 'z-a':
            sortQuery = { productName: -1 };
            break;
         case 'new-arrivals':
            sortQuery = { createdAt: -1 };
            break;
         default:
            sortQuery = { createdAt: -1 };
      }

      const products = await Product.find({
         isBlocked: false,
         category: { $in: categoryIds },
         stock: { $gt: 0 },
      })
         .populate("category")
         .sort(sortQuery) // Apply the sorting
         .skip(skip)
         .limit(limit);

      const totalProducts = await Product.countDocuments({
         isBlocked: false,
         category: { $in: categoryIds },
         stock: { $gt: 0 },
      });

      const totalPages = Math.ceil(totalProducts / limit);

      const categoriesWithIds = categories.map(category => ({ _id: category._id, name: category.name }));

      res.render('shop1', {
         user: userData,
         products: products,
         category: categoriesWithIds,
         brand: brand,
         totalProducts: totalProducts,
         currentPage: page,
         totalPages: totalPages,
         sort: sortOption,
         productsFound: products.length > 0,
      });
   } catch (error) {
      console.error(error);
      res.redirect("/pageNotFound");
   }
};


const filterProduct = async (req, res) => {
   try {
      const user = req.session.user;
      const category = req.query.category;
      const brand = req.query.brand;
      const page = parseInt(req.query.page) || 1;
      const limit = 6;

      const sortOption = req.query.sort || 'new-arrivals';

      const findCategory = category ? await Category.findOne({ _id: category }) : null;
      const findBrand = brand ? await Product.findOne({ brand: brand }) : null;

      const query = {
         isBlocked: false,
         stock: { $gt: 0 },
      }

      if (findCategory) {
         query.category = findCategory._id;
      }

      if (findBrand) {
         query.brand = findBrand.brand;
      }

      // Apply sorting logic
      let sortQuery = {};
      switch (sortOption) {
         case 'price-low-to-high':
            sortQuery = { basePrice: 1 };
            break;
         case 'price-high-to-low':
            sortQuery = { basePrice: -1 };
            break;
         case 'a-z':
            sortQuery = { productName: 1 };
            break;
         case 'z-a':
            sortQuery = { productName: -1 };
            break;
         case 'new-arrivals':
            sortQuery = { createdAt: -1 };
            break;
         default:
            sortQuery = { createdAt: -1 };
      }

      // Count total products for pagination
      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);
      const skip = (page - 1) * limit;

      // Get paginated products
      const findProducts = await Product.find(query)
         .populate("category")
         .sort(sortQuery)
         .skip(skip)
         .limit(limit)
         .lean();

      const categories = await Category.find({ isListed: true });

      const productBrands = await Product.find({});
      const brands = [...new Set(productBrands.map(product => product.brand))];

      let userData = null;
      if (user) {
         userData = await User.findOne({ _id: user });
         if (userData) {
            const searchEntry = {
               category: findCategory ? findCategory._id : null,
               brand: findBrand ? findBrand.brand : null
            };

            // Store search history if needed
            // This was incomplete in the original code
         }
      }

      res.render('shop1', {
         user: userData,
         products: findProducts,
         category: categories,
         brand: brands,
         currentPage: page,
         totalPages: totalPages,
         selectedCategory: category || null,
         selectedBrand: brand || null,
         sort: sortOption,
         productsFound: findProducts.length > 0
      });
   } catch (error) {
      console.error(error);
      res.redirect("/pageNotFound");
   }
};

const filterByPrice = async (req, res) => {
   try {
      const user = req.session.user;
      // Parse and validate price values
      const gt = req.query.gt && !isNaN(parseFloat(req.query.gt)) ? parseFloat(req.query.gt) : 0;
      const lt = req.query.lt && !isNaN(parseFloat(req.query.lt)) ? parseFloat(req.query.lt) : 100000;

      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;
      const sortOption = req.query.sort || 'new-arrivals';

      // Create price filter query with validated values
      const query = {
         isBlocked: false,
         stock: { $gt: 0 },
         basePrice: { $gt: gt, $lt: lt }
      };

      // Apply sorting logic
      let sortQuery = {};
      switch (sortOption) {
         case 'price-low-to-high':
            sortQuery = { basePrice: 1 };
            break;
         case 'price-high-to-low':
            sortQuery = { basePrice: -1 };
            break;
         case 'a-z':
            sortQuery = { productName: 1 };
            break;
         case 'z-a':
            sortQuery = { productName: -1 };
            break;
         case 'new-arrivals':
            sortQuery = { createdAt: -1 };
            break;
         default:
            sortQuery = { createdAt: -1 };
      }

      // Count total products for pagination
      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);

      // Fetch filtered products with pagination
      const products = await Product.find(query)
         .populate("category")
         .sort(sortQuery)
         .skip(skip)
         .limit(limit)
         .lean();

      // Fetch categories and brands for sidebar filters
      const categories = await Category.find({ isListed: true });
      const productBrands = await Product.find({});
      const brands = [...new Set(productBrands.map(product => product.brand))];

      let userData = null;
      if (user) {
         userData = await User.findOne({ _id: user });
      }

      res.render('shop1', {
         user: userData,
         products: products,
         category: categories,
         brand: brands,
         currentPage: page,
         totalPages: totalPages,
         gt: gt,
         lt: lt,
         sort: sortOption,
         productsFound: products.length > 0
      });
   } catch (error) {
      console.error(error);
      res.redirect("/pageNotFound");
   }
};

const searchProducts = async (req, res) => {
   try {
      const user = req.session.user;
      // Store the search query from either POST body or GET query parameters
      const searchQuery = req.body.query || req.query.query;

      // Get filter parameters from either POST body or GET query
      const category = req.body.category || req.query.category;
      const brand = req.body.brand || req.query.brand;
      const gt = req.body.gt || req.query.gt;
      const lt = req.body.lt || req.query.lt;

      // Only parse values if they exist and can be converted to valid numbers
      const gtValue = gt && !isNaN(parseFloat(gt)) ? parseFloat(gt) : undefined;
      const ltValue = lt && !isNaN(parseFloat(lt)) ? parseFloat(lt) : undefined;

      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;
      const sortOption = req.query.sort || 'new-arrivals';

      if (!searchQuery) {
         return res.redirect('/shop');
      }

      // If it's a POST request, redirect to GET to enable pagination, preserving filter parameters
      if (req.method === 'POST') {
         let redirectUrl = `/search?query=${encodeURIComponent(searchQuery)}&page=1&sort=${sortOption}`;
         if (category) redirectUrl += `&category=${encodeURIComponent(category)}`;
         if (brand) redirectUrl += `&brand=${encodeURIComponent(brand)}`;
         if (gtValue !== undefined && ltValue !== undefined) {
            redirectUrl += `&gt=${gtValue}&lt=${ltValue}`;
         }
         return res.redirect(redirectUrl);
      }

      // Create MongoDB search query
      const mongoQuery = {
         isBlocked: false,
         stock: { $gt: 0 },
         $or: [
            { productName: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } },
            { brand: { $regex: searchQuery, $options: 'i' } }
         ]
      };

      // Apply filters if present
      if (category) {
         const findCategory = await Category.findOne({ _id: category });
         if (findCategory) {
            mongoQuery.category = findCategory._id;
         }
      }
      if (brand) {
         mongoQuery.brand = brand;
      }

      // Only add price filter if both values are valid numbers
      if (gtValue !== undefined && ltValue !== undefined) {
         mongoQuery.basePrice = { $gt: gtValue, $lt: ltValue };
      }

      // Apply sorting logic
      let sortQuery = {};
      switch (sortOption) {
         case 'price-low-to-high':
            sortQuery = { basePrice: 1 };
            break;
         case 'price-high-to-low':
            sortQuery = { basePrice: -1 };
            break;
         case 'a-z':
            sortQuery = { productName: 1 };
            break;
         case 'z-a':
            sortQuery = { productName: -1 };
            break;
         case 'new-arrivals':
            sortQuery = { createdAt: -1 };
            break;
         default:
            sortQuery = { createdAt: -1 };
      }

      // Count total products for pagination
      const totalProducts = await Product.countDocuments(mongoQuery);
      const totalPages = Math.ceil(totalProducts / limit);

      // Fetch searched products with pagination
      const products = await Product.find(mongoQuery)
         .populate("category")
         .sort(sortQuery)
         .skip(skip)
         .limit(limit)
         .lean();

      // Fetch categories and brands for sidebar filters
      const categories = await Category.find({ isListed: true });
      const productBrands = await Product.find({});
      const brands = [...new Set(productBrands.map(product => product.brand))];

      let userData = null;
      if (user) {
         userData = await User.findOne({ _id: user });
      }

      // Ensure we're rendering with the search query param for pagination links
      res.render('shop1', {
         user: userData,
         products: products,
         category: categories,
         brand: brands,
         currentPage: page,
         totalPages: totalPages,
         query: searchQuery, // This is essential for proper pagination after search
         sort: sortOption,
         productsFound: products.length > 0,
         selectedCategory: category || null,
         selectedBrand: brand || null,
         gt: gtValue !== undefined ? gtValue : null,
         lt: ltValue !== undefined ? ltValue : null
      });
   } catch (error) {
      console.error(error);
      res.redirect("/pageNotFound");
   }
};





module.exports = {
   loadHomepage,
   pageNotFound,
   loadLogin,
   loadSignup,
   signup,
   getverifyOtp,
   verifyOtp,
   resendOtp,
   login,
   logout,
   loadShopingPage,
   filterProduct,
   filterByPrice,
   searchProducts,

}