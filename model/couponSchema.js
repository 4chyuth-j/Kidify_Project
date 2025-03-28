const mongoose = require("mongoose");
const { Schema } = mongoose;


const couponSchema = new Schema({

    
    name: {
        type: String,
        required: true,
        unique: true, 
    },

    

    
    expireOn: {
        type: Date,
        required: true,
    },

   
    offerPrice: {
        type: Number,
        required: true,
    },

    minimumPrice: {  
        type: Number,
        required: true,
    },

    isList: {
        type: Boolean,
        default: true, 
    },

    // List of users who have used or are eligible to use the coupon
    userId: [{
        type: Schema.Types.ObjectId,
        ref: 'User', 
    }]
},{timestamps:true});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
