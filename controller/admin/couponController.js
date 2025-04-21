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
        console.log("Error in loading coupon listing page:", error);
        res.redirect("/pageError");
    }
}


const loadAddCoupon = async (req,res)=>{
    try {
        return res.render("addCoupon", { pageTitle: "Add Coupon" });
    } catch (error) {
        console.log("Error in loading add coupon page:", error);
        res.redirect("/pageError");
    }
}



const addCoupon = async (req,res)=>{
    try {
        const {name,startOn,expireOn,offerPrice,minimumPrice,maxUsage,isList} = req.body;
        
        const couponExists = await Coupon.findOne({name});
        if(couponExists){
            return res.status(400).json({message:`Coupon with ${name} already exists. `});
        }

        const newCoupon = new Coupon({
            name,
            startOn,
            expireOn,
            offerPrice,
            minimumPrice,
            maxUsage,
            isList
        });

        await newCoupon.save();
        return res.status(200).json({ message: "Coupon added successfully" });


    } catch (error) {
        console.log("Error in loading add coupon page:", error);
        res.status(500).json({message:"Something went wrong!"});
    }
}


const loadEditCoupon = async (req,res)=>{
    try {
        const couponId = req.query.id;
        if(!couponId){
            console.log("failed to receive the coupon id from front end");
            return;
        }
        const couponDetails = await Coupon.findOne({_id:couponId});
        if(!couponDetails){
            console.log("Something went wrong while finding coupon details");
            return;
        }
        return res.render("editCoupon",{coupon:couponDetails,pageTitle: "Edit Coupon"});
    } catch (error) {
        console.log("Error in loading edit coupon page:", error);
        res.redirect("/pageError");
    }
}



const editCoupon = async (req, res) => {
    try {
      const {
        name,
        startOn,
        expireOn,
        offerPrice,
        minimumPrice,
        maxUsage,
        isList,
        couponId
      } = req.body;
  
      
      
  
      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found." });
      }
  
      // Optional: check if name change collides with other coupons
      if (coupon.name !== name) {
        const nameExists = await Coupon.findOne({ name });
        if (nameExists) {
          return res.status(400).json({ message: "Coupon name already in use." });
        }
        coupon.name = name;
      }
  
      coupon.startOn = startOn;
      coupon.expireOn = expireOn;
      coupon.offerPrice = offerPrice;
      coupon.minimumPrice = minimumPrice;
      coupon.maxUsage = maxUsage;
      coupon.isList = isList;
  
      await coupon.save();
      return res.status(200).json({ message: "Coupon edited successfully" });
  
    } catch (error) {
      console.log("Error in editing coupon:", error);
      res.status(500).json({ message: "Something went wrong!" });
    }
  };
  





module.exports = {
    loadCoupon,
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon
}