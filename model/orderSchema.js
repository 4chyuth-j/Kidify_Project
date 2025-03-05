const mongoose = require("mongoose"); // Importing the Mongoose library for MongoDB interactions
const { Schema } = mongoose; // Extracting Schema from Mongoose
const { v4: uuidv4 } = require('uuid'); // Importing UUID package for generating unique order IDs

/* 
   - UUID (Universally Unique Identifier) is used to generate unique order IDs.
   - `v4` generates a random UUID.
   - `{ v4: uuidv4 }` renames `v4` to `uuidv4` for easy use in the code.
*/

// Define the schema for order details
const orderSchema = new Schema({
    
    // Unique order ID generated using UUID
    orderId: {
        type: String,
        default: () => uuidv4(), // Generates a unique ID when a new order is created
        unique: true, // Ensures each order has a unique ID
    },

    // Array to store ordered items
    orderedItems: [{
        
        // Product reference (linked to the "Product" collection)
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        // Quantity of the product ordered
        quantity: {
            type: Number,
            required: true,
        },

        // Price of the product at the time of purchase
        price: {
            type: Number,
            default: 0,
        },
    }],

    // Total price before applying any discounts
    totalPrice: {
        type: Number,
        required: true,
    },

    // Discount amount applied on the order
    discount: {
        type: Number,
        default: 0,
    },

    // Final amount to be paid after discounts
    finalAmount: {
        type: Number,
        required: true,
    },

    // Address ID (linked to the "User" collection, should be "Address" if referring to address schema)
    address: {
        type: Schema.Types.ObjectId,
        ref: "User", // ⚠️ This should probably be "Address" instead of "User"
        required: true,
    },

    // Date when the invoice was generated
    invoiceDate: {
        type: Date,
    },

    // Status of the order (only accepts predefined values)
    status: {
        type: String,
        required: true,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"],
    },

    // Date when the order was created
    createdOn: {
        type: Date,
        default: Date.now, // Automatically sets the current timestamp
        required: true,
    },

    // Indicates if a coupon was applied to the order
    couponApplied: {
        type: Boolean,
        default: false,
    },

});

// Creating the Order model from the schema
const Order = mongoose.model("Order", orderSchema);

// Exporting the model so it can be used in other parts of the application
module.exports = Order;
