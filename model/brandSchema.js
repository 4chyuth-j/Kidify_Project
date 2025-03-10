const mongoose = require('mongoose'); // Import Mongoose library
const { Schema } = mongoose; // Extract Schema from Mongoose

// Define the schema for storing brand details
const brandSchema = new Schema({

    // Name of the brand (e.g., Nike, Adidas)
    brandName: {
        type: String, 
        required: true, // Brand name is mandatory
    },

    // Array to store images related to the brand (e.g., logo, banners)
    brandImage: {
        type: [String], // Stores image URLs in an array
        required: true, // At least one image is required
    },

    // Indicates whether the brand is blocked (e.g., for admin control)
    isBlocked: {
        type: Boolean, 
        default: false, // By default, the brand is active (not blocked)
    },

   

},{timestamps:true});

// Create the Brand model from the schema
const Brand = mongoose.model("Brand", brandSchema);

// Export the model so it can be used in other parts of the application
module.exports = Brand;
