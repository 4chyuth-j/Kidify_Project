const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema for coupons
const couponSchema = new Schema({

    // Name of the coupon (e.g., "NEWUSER50")
    name: {
        type: String,
        required: true,
        unique: true, // Ensures that each coupon name is unique
    },

    // Date when the coupon is created (defaults to the current date/time)
    createdOn: {
        type: Date,
        default: Date.now, // Automatically sets the current date when a coupon is created
        required: true,
    },

    // Expiry date of the coupon (when it will no longer be valid)
    expireOn: {
        type: Date,
        required: true,
    },

    // The discount amount (offer price) provided by the coupon
    offerPrice: {
        type: Number,
        required: true,
    },

    // The minimum price of a purchase required to apply this coupon
    minimumPirce: {  // (Note: "Pirce" should be corrected to "Price")
        type: Number,
        required: true,
    },

    // Determines if the coupon is active and listed for use
    isList: {
        type: Boolean,
        default: true, // If true, the coupon is available for use
    },

    // List of users who have used or are eligible to use the coupon
    userId: [{
        type: Schema.Types.ObjectId,
        ref: 'User', // Refers to the User collection
    }]
});

// Create the Coupon model from the schema
const Coupon = mongoose.model("Coupon", couponSchema);

// Export the model so it can be used in other parts of the application
module.exports = Coupon;
