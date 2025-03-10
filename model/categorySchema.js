const mongoose = require("mongoose"); // Import Mongoose library

const { Schema } = mongoose; // Extract Schema from Mongoose

// Define the schema for storing category details
const categorySchema = new Schema({
    
    // Category name (e.g., "Shirts", "Shoes")
    name: {
        type: String, 
        required: true, // Category must have a name
        unique: true, // Category name must be unique
    },

    // A short description of the category
    description: {
        type: String, 
        required: true, // Description is mandatory
    },

    // Determines if the category is active/listed
    isListed: {
        type: Boolean, 
        default: true, // By default, the category is listed
    },

    // Discount offer percentage for the entire category
    categoryOffer: {
        type: Number, 
        default: 0, // Default offer is 0 (no discount)
    },

    // Stores the thumbnail images for the category
    thumbnail: {
        type: [String], // Array of image URLs
        required: true, // At least one image is required
    },

   
},{timestamps:true});

// Create the Category model from the schema
const Category = mongoose.model("Category", categorySchema);

// Export the model so it can be used in other parts of the application
module.exports = Category;
