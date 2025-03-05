const mongoose = require("mongoose"); // Importing Mongoose to interact with MongoDB
const { Schema } = mongoose; // Extracting Schema from Mongoose

// Defining the schema for the Banner collection
const bannerSchema = new Schema({
   
    // URL or file path of the banner image
    image: {
        type: String,
        required: true, // Banner must have an image
    },

    // Title of the banner (e.g., "Big Summer Sale")
    title: {
        type: String,
        required: true, // Title is mandatory
    },

    // Description providing details about the banner (e.g., "Up to 50% off on kids' clothing")
    description: {
        type: String,
        required: true, // Description is mandatory
    },

    // Optional link for the banner (e.g., redirecting to a specific product or category)
    link: {
        type: String,
    },

    // The date when the banner should start appearing on the website
    startDate: {
        type: Date,
        required: true, // Ensures the banner has a defined start date
    },

    // The date when the banner should stop being displayed
    endDate: {
        type: Date,
        required: true, // Ensures the banner has a defined end date
    }

});

// Creating the Banner model from the schema
const Banner = mongoose.model("Banner", bannerSchema);

// Exporting the model so it can be used in other parts of the application
module.exports = Banner;
