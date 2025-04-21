const Coupon = require('../../model/couponSchema');


const loadCoupon = async (req, res) => {
    try {

        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const coupons = await Coupon.find({
            name: { $regex: ".*" + search + ".*", $options: "i" }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCoupons = await Coupon.find({
            name: { $regex: ".*" + search + ".*", $options: "i" }
        }).countDocuments();
        const totalPages = Math.ceil(totalCoupons / limit);


        return res.render("coupon", { 
            coupons,
            currentPage:page,
            totalPages,
            pageTitle: "Coupons" 
        });
    } catch (error) {
        res.redirect("/pageError");
    }
}



module.exports = {
    loadCoupon,
}