const User = require('../../model/userSchema');


const loadAbout = async (req,res)=>{
    try {
        const user = req.session.user;
        const userData = await User.findOne({_id:user});
        res.render('about.ejs',{user:userData});

    } catch (error) {
        console.log("something went wrong while loading the about page:",error);
        res.redirect("/pageNotFound");
    }
}

const loadContact = async (req,res)=>{
    try {
        const user = req.session.user;
        const userData = await User.findOne({_id:user});
        res.render('contact.ejs',{user:userData});
    } catch (error) {
         console.log("something went wrong while loading the contact page:",error);
        res.redirect("/pageNotFound");
    }
}

module.exports = {
    loadAbout,
    loadContact
}