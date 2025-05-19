
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
                if (req.xhr || req.headers.accept.includes('json')) {
                    return res.status(500).json({ message: 'Internal server error' });
                }
                res.status(500).send("Internal server error"); 
            });
            
        } else {

        if (req.xhr || req.headers.accept.includes('json')) {   
            /*Using fetch()? 👉 req.headers.accept.includes('json') catches it.

            Your middleware now knows: “Yo this is not a browser page request — send JSON.”

            Works beautifully with fetch(), Axios, jQuery AJAX — anything that sends Accept: application/json. */
            return res.status(401).json({ message: 'Please log in first to continue shopping' });
        }
       
        res.redirect("/login");
    }
};


//admin middleware
const adminAuth = (req, res, next) => {
    
    if(req.session.admin){

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


    } else {

         res.redirect("/admin/login");

    }
    
    
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
