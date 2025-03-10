const User = require("../../model/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");



const loadLogin = async (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/dashboard");
    }
    res.render("admin-login.ejs",{message:null});
}




module.exports = {
    loadLogin,

}