const mongoose = require("mongoose"); // Importing the Mongoose library for MongoDB interactions
const { Schema } = mongoose; // Extracting Schema from Mongoose
const { nanoid } = require('nanoid');


const orderSchema = new Schema({
    
    
    orderId: {
        type: String,
        default: () => `ORD-${nanoid(10)}`, 
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
        ref: "Address",
        required: true,
      },

    // Date when the invoice was generated
    invoiceDate: {
        type: Date,
        default: Date.now
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


    paymentMethod: {
        type: String,
        enum: ['COD', 'Online Payment', 'Wallet'],
        required: true,
      },
      

    cancellationReason: {
        type: String,
        default: ""
      }

},{timestamps:true});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
