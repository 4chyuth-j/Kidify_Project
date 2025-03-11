// Import the User model to interact with the database
const User = require("../model/userSchema");

// Middleware function to authenticate regular users
const userAuth = (req, res, next) => {
    
    // Check if the user session exists (i.e., the user is logged in)
    if (req.session.user) {
        
        // Find the user in the database using the stored session user ID
        User.findById(req.session.user)
            .then(data => {
                
                // If user exists and is not blocked, allow access to the next middleware/route
                if (data && !data.isBlocked) {
                    next(); // Move to the next middleware or route handler
                } else {
                    // If user is blocked or does not exist, redirect them to the login page
                    res.redirect("/login");
                }
            })
            .catch(error => {
                // Handle errors during the database query
                console.log("Error in user authentication middleware", error);
                res.status(500).send("Internal server error"); // Send an error response
            });

    } else {
        // If no user session exists, redirect to login page
        res.redirect("/login");
    }
};

// Middleware function to authenticate admin users
const adminAuth = (req, res, next) => {
    
    // Search for a user with the 'isAdmin' flag set to true
    User.findOne({ isAdmin: true })
        .then(data => {

            // If an admin user exists, allow access to the next middleware/route
            if (data) {
                next();
            } else {
                // If no admin user is found, redirect to the admin login page
                res.redirect("/admin/login");
            }
        })
        .catch(error => {
            // Handle errors during the database query
            console.log("Error in admin authentication middleware", error);
            res.status(500).send("Internal server error"); // Send an error response
        });
};

// Export both middleware functions for use in other routes
module.exports = {
    userAuth,
    adminAuth,
};
