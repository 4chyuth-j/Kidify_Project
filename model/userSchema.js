const mongoose = require("mongoose");
const { Schema } = mongoose; // Extract Schema from mongoose

// Define the User schema
const userSchema = new Schema({
    name: {
        type: String,
        required: true // Name field is required
    },
    email: {
        type: String,
        required: true, // Email field is required
        unique: true, // Ensures no duplicate emails
    },
    phone: {
        type: String,
        required: false, // Phone number is optional
        unique: false, // Multiple users can have the same phone number
        sparse: true, // Allows null values without affecting uniqueness constraint
        default: null, // Default value is null
    },
    // Google ID omitted as referred in the video
    password: {
        type: String,
        required: true // Password is required
    },
    isBlocked: {
        type: Boolean,
        default: false, // By default, users are not blocked
    },
    // isAdmin field can be added if needed

    cart: [{ 
        /*
        - `cart` is an array, meaning a user can have multiple items in their cart.
        - Each item in the cart is an ObjectId, which is a unique ID referencing documents from another collection called `Cart`.
        - `ref: "Cart"` tells Mongoose that these ObjectIds belong to the `Cart` collection.
        */
        type: Schema.Types.ObjectId,
        ref: "Cart",
    }],

    wallet: {
        type: Number,
        default: 0, // Default wallet balance is 0
    },

    wishlist: [{
        type: Schema.Types.ObjectId,
        ref: "Wishlist", // References the Wishlist collection
    }],

    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Order" // References the Order collection to store past orders
    }],

    createdOn: {
        type: Date,
        default: Date.now, // Automatically sets the creation date
    },
    // Referral code omitted from the video

    searchHistory: [{
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category", // References the Category collection for searches
        },

        brand: {
            type: String, // Stores the brand name that the user searched for
        },

        searchOn: {
            type: Date,
            default: Date.now, // Automatically sets the search timestamp
        }
    }]
});

// Create a model for User collection
const User = mongoose.model("User", userSchema);
/*
- `mongoose.model("User", userSchema)` connects the schema to MongoDB.
- This tells MongoDB how to structure user documents.
- "User" is the name of the collection, but MongoDB will automatically change it to "users" (plural form).
*/

module.exports = User; // Exports the User model for use in other parts of the application
