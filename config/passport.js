const passport = require("passport"); // Importing passport for authentication
const GoogleStrategy = require("passport-google-oauth20").Strategy; // Importing Google OAuth strategy
const User = require("../model/userSchema"); // Importing User model to interact with the database


// Configuring Passport to use Google OAuth strategy for authentication
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, // Google Client ID from environment variables
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google Client Secret from environment variables
    // callbackURL: 'http://localhost:4000/google/callback'  // URL where Google will redirect after authentication
    callbackURL: 'https://www.achyuth.xyz//google/callback'  // URL where Google will redirect after authentication
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Checking if a user with the given Google ID already exists in the database.
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
                
                if (user.isBlocked) { // Assuming "isBlocked" is the field that stores the block status
                    return done(null, false, { message: "Your account has been blocked by the admin." });
                }

                // If user already exists, return the user object
                return done(null, user); // done() is a callback that passes user data to Passport


            } else {
                // If user doesn't exist, create a new user entry in the database
                user = new User({
                    name: profile.displayName, // Storing user's display name from Google profile
                    email: profile.emails[0].value, // Extracting user's email from Google profile
                    googleId: profile.id, // Storing unique Google ID for future authentication
                });
                
               
                await user.save(); // Saving the new user to the database
                return done(null, user); // Returning the new user object
            }
        } catch (error) {
            return done(error, null); // If there's an error, pass it to Passport
        }
    }
));

// Serialize user function - Determines what user data should be stored in the session
passport.serializeUser((user, done) => {
    done(null, user.id); // Only store the user's unique ID in the session
});

// Deserialize user function - Retrieves user details from the session using the stored ID
passport.deserializeUser((id, done) => {
    User.findById(id) // Fetch user details from the database using the ID
        .then(user => {
            done(null, user); // Pass the user object to the request
        })
        .catch(err => {
            done(err, null); // Handle errors during retrieval
        });
});

module.exports = passport; // Export configured passport instance to use in other files

