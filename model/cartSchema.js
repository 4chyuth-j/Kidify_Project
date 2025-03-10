const mongoose = require("mongoose"); // Import Mongoose library
const { Schema } = mongoose; // Extract Schema from Mongoose

// Define the schema for storing cart details
const cartSchema = new Schema({
    
    // Reference to the user who owns the cart
    userId: {
        type: Schema.Types.ObjectId, // Stores the unique user ID
        ref: "User", // References the "User" collection
        required: true, // A cart must belong to a user
    },

    // Array of items added to the cart
    items: [{
        
        // Reference to the product added to the cart
        productId: {
            type: Schema.Types.ObjectId, // Stores the unique product ID
            ref: "Product", // References the "Product" collection
            required: true, // Every cart item must have a product
        },

        // Number of units of the product in the cart
        quantity: {
            type: Number, 
            default: 1, // Default quantity is 1
        },

        // Price of a single unit of the product
        price: {
            type: Number, 
            required: true, // Price must be specified
        },

        // Total price for the product based on quantity
        totalPrice: {
            type: Number, 
            required: true, // Total price must be calculated
        },

        // Status of the item in the cart (e.g., placed, pending)
        status: {
            type: String, 
            default: "placed", // Default status is "placed"
        },

        // If the product is canceled, the reason is stored here
        cancellationReason: {
            type: String, 
            default: "none", // Default value is "none" (not canceled)
        }

    }]
},{timestamps:true});

// Create the Cart model from the schema
const Cart = mongoose.model("Cart", cartSchema);

// Export the model so it can be used in other parts of the application
module.exports = Cart;
