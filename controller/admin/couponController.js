const Coupon = require('../../model/couponSchema');


const loadCoupon = async (req,res)=>{
    try {
        return res.render("coupon");
    } catch (error) {
        res.redirect("/pageError");
    }
}



module.exports ={
    loadCoupon,
}