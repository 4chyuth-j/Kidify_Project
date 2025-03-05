const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the schema for storing user addresses
const addressSchema = new Schema({

    // Reference to the user who owns this address
    userId: {
        type: Schema.Types.ObjectId, // Stores the unique user ID
        ref: "User", // Links to the User collection
        required: true, // Ensures that an address must belong to a user
    },

    // Array of addresses (a user can have multiple addresses)
    address: [{
        
        // Type of address (e.g., Home, Work, Other)
        addressType: {
            type: String,
            required: true,
        },

        // Name of the recipient for this address
        name: {
            type: String,
            required: true,
        },

        // City where the address is located
        city: {
            type: String,
            required: true,
        },

        // A nearby landmark for easy identification
        landMark: {
            type: String,
            required: true,
        },

        // State where the address is located
        state: {
            type: String,
            required: true,
        },

        // Postal code (ZIP code) of the address location
        pincode: {
            type: Number,
            required: true,
        },

        // Primary contact number for this address
        phone: {
            type: Number,
            required: true,
        },

        // Alternative contact number in case the primary one is unavailable
        altPhone: {
            type: Number,
            required: true,
        }
    }]
});

// Create the Address model from the schema
const Address = mongoose.model("Address", addressSchema);

// Export the model so it can be used in other parts of the application
module.exports = Address;
