// const multer = require("multer");
// const path = require("path");
// const { db } = require("../model/productSchema");
// const { fileLoader } = require("ejs");

// const storage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,path.join(__dirname,"../public/uploads/re-image"));
//     },
//     filename:(req,file,cb)=>{
//         cb(null,Date.now()+"-"+file.originalname);
//     }
// });


// module.exports = storage;






// config/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure CloudinaryStorage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 're-image', // This replaces your local folder path
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1000, crop: 'limit' }] // Optional: resize images
  }
});

// Configure multer to use Cloudinary storage
const uploads = multer({ storage: storage });

module.exports = {
  uploads,
  cloudinary
};