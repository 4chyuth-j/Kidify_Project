
const User = require("../model/userSchema");

// Middleware function to authenticate regular users
const userAuth = (req, res, next) => {
    
    
    if (req.session.user) {
        
        // Find the user in the database using the stored session user ID
        User.findById(req.session.user)
            .then(data => {
                
               
                if (data && !data.isBlocked) {
                    next(); 
                } else {
                   
                    res.redirect("/login");
                }
            })
            .catch(error => {
                
                console.log("Error in user authentication middleware", error);
                res.status(500).send("Internal server error"); 
            });

    } else {
       
        res.redirect("/login");
    }
};


//admin middleware
const adminAuth = (req, res, next) => {
    
    
    User.findOne({ isAdmin: true })
        .then(data => {

           
            if (data) {
                next();
            } else {
               
                res.redirect("/admin/login");
            }
        })
        .catch(error => {
            
            console.log("Error in admin authentication middleware", error);
            res.status(500).send("Internal server error"); // Send an error response
        });
};


//otp varification middleware
const ensureOtpExists = (req, res, next) => {
    if (!req.session.userOtp) {
        return res.redirect('/forgot-password'); 
    }
    next();

    
};


const ensureEmailSession = (req, res, next) => {
    if (!req.session.email) {
        return res.redirect('/forgot-password'); 
    }
    next();
};



// Export both middleware functions for use in other routes
module.exports = {
    userAuth,
    adminAuth,
    ensureOtpExists,
    ensureEmailSession
};
