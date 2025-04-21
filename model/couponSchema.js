const mongoose = require("mongoose");
const { Schema } = mongoose;


const couponSchema = new Schema({

    
    name: {
        type: String,
        required: true,
        unique: true, 
    },

    startOn: {
        type: Date,
        required: true,
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

    //how many times this coupon can be used among all the users combined
    maxUsage: {
        type: Number,
        default: 100,
    },

    // List of users who have used the coupon
    userId: [{
        type: Schema.Types.ObjectId,
        ref: 'User', 
    }]
},{timestamps:true});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
