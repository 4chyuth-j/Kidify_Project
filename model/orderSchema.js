const mongoose = require("mongoose"); // Importing the Mongoose library for MongoDB interactions
const { Schema } = mongoose; // Extracting Schema from Mongoose
const { v4: uuidv4 } = require('uuid'); // Importing UUID package for generating unique order IDs

/* 
   - UUID (Universally Unique Identifier) is used to generate unique order IDs.
   - `v4` generates a random UUID.
   - `{ v4: uuidv4 }` renames `v4` to `uuidv4` for easy use in the code.
*/


const orderSchema = new Schema({
    
    
    orderId: {
        type: String,
        default: () => uuidv4(), 
        unique: true, 
    },

    orderedItems: [{
        
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
        },

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

    
    address: {
        type: Schema.Types.ObjectId,
        ref: "User", 
        required: true,
    },

    // Date when the invoice was generated
    invoiceDate: {
        type: Date,
    },

    status: {
        type: String,
        required: true,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Request", "Returned"],
    },

   

    couponApplied: {
        type: Boolean,
        default: false,
    },

},{timestamps:true});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
