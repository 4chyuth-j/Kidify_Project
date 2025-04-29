const Product = require("../../model/productSchema");
const Category = require("../../model/categorySchema");
const User = require("../../model/userSchema");



const productDetails = async (req, res) => {
    try {

        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product = await Product.findById(productId).populate("category");
        const findCategory = product.category;

        const products = await Product.find({
            category: findCategory._id,
            _id: { $nin: [productId] }
        }).populate("category")
          .lean();

        const productOffer = Math.max(
            product.discountPercentage || 0,
            product.category.categoryOffer || 0
        );


        res.render("product-details", {
            user: userData,
            product: product,
            stock: product.stock,
            productOffer,
            category: findCategory,
            products: products
        });
    } catch (error) {
        console.log("something went wrong while displaying product details page");
        res.redirect("/pageNotFound");
    }
}


module.exports = {
    productDetails,
}