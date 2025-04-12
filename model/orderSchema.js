const mongoose = require("mongoose"); // Importing the Mongoose library for MongoDB interactions
const { Schema } = mongoose; // Extracting Schema from Mongoose
const { nanoid } = require('nanoid');


const orderSchema = new Schema({

    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

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

        returnedAt: { type: Date, default: null },

        returnStatus: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },

        returnReason: { type: String, default: '' },

        cancelled: { type: Boolean, default: false },

        cancelledAt: { type: Date, default: null },
        
        cancelReason: { type: String, default: '' }
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

    /*Because a user might edit or delete their address later.
    But your order invoice should keep the original delivery address as it was.*/

    deliveryAddress: {
        type: Object, // We'll store the actual selected address object here
        required: true,
    },
    

    // Date when the invoice was generated
    invoiceDate: {
        type: Date,
        default: Date.now
    },
    
    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE', 'Wallet'],
        required: true,
    },
    
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Pending'
    },

    orderStatus: {
        type: String,
        enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
        default: 'Placed'
    },

    expectedDeliveryDate: {
        type: Date,
        default: () => {
            const now = new Date();
            now.setDate(now.getDate() + 7);
            return now;
        }
    },
    



    couponApplied: {
        type: Boolean,
        default: false,
    },




    cancellationReason: {
        type: String,
        default: ""
    },

    deliveredAt: {
        type: Date,
        default: null
    },



}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
