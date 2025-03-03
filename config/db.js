const mongoose = require("mongoose");
const env = require("dotenv").config();
const address = process.env.MONGODB_URI;

// Async function to connect MongoDB and it is invoked in app.js file
const connectDB = async () => {
    try {
        
        const conn = await mongoose.connect(address); // No extra options needed like in above code they are depricated.
    
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`); //(conn.connection.host)=> prints the MongoDB server host (which is 127.0.0.1 in this case).
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1); // Exit process if connection fails
    }
};

module.exports = connectDB;