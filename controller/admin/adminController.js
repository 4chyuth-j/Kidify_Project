const User = require("../../model/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


// loading login page of admin
const loadLogin = async (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard");
    }
    res.render("admin-login.ejs",{message:null});
}


// login post 
const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        const admin = await User.findOne({email,isAdmin:true});
        console.log(email);
        if(!admin){
            return res.render("admin-login",{message:"Admin don't exist!"});
        }
        if(admin){
            const passwordMatch = await bcrypt.compare(password,admin.password);
            console.log("passwordMatch:",passwordMatch);
            if(!passwordMatch){
                console.log("password don't match");
                return res.render("admin-login.ejs",{message:"Incorrect password. Please try again."});
                
            }
            
            if(passwordMatch){
                
                console.log("password matched successfully.");
                req.session.admin= true;
                return res.redirect("/admin/")
            } else{
                return res.redirect("/login");
            }
        }

    } catch (error) {
         console.log("login error:",error);
         return res.redirect("/pageError");
    }
}


//load Dashboard
const loadDashboard = async (req,res)=>{
    try {
        if(req.session.admin){
            res.render("dashboard");
        }
    } catch (error) {
        console.log("Error in loading the dashboard");
        res.redirect("/pageError");
    }
}


module.exports = {
    loadLogin,
    login,
    loadDashboard,

}