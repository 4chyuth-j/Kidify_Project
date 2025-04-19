const mongoose = require("mongoose");

const {Schema}=mongoose;

const productSchema = new Schema({
    productName:{
        type:String,
        required:true,
    },

    description:{
        type:String,
        required:true,
    },

    brand:{
        type:String,
        required: true,
    },

    category:{
        type:Schema.Types.ObjectId ,
        ref:"Category",
        required:true,        
    },

    basePrice:{
        type:Number,
        required:true,
    },

    discountPercentage:{
        type:Number,
        required:true,
    },

    stock:{
         type:Number,
         default:true
    },

    productImage:{
        type:[String],
        required:true,
    },

    isBlocked:{
        type:Boolean,
        default:false,
    },

    status:{
        type:String,
        enum:["Available","Out of Stock","Discontinued"],
        require:true,
        default:"Available",
    },
    


   
},{timestamps:true});
/*The { timestamps: true } option in Mongoose automatically adds two fields to your schema:

createdAt → Stores the date & time when the document was created.
updatedAt → Stores the date & time when the document was last updated. */


const Product = mongoose.model("Product",productSchema);

module.exports = Product;