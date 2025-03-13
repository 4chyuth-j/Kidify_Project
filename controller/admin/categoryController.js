const Category = require("../../model/categorySchema");







const categoryInfo = async (req, res) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({
            name: { $regex: ".*" + search + ".*", $options: "i" }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.find({
            name: { $regex: ".*" + search + ".*", $options: "i" }
        }).countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render("category", {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories,
            pageTitle: "Catergory Management",

        });

    } catch (error) {

        console.log("Error while showing category page: ", error);
        res.redirect("/pageError");

    }
}



const loadAddCategory = async (req, res) => {
    try {
        return res.render("addCategory", { pageTitle: "Add Category" });
    } catch (error) {
        console.log("Error in loading add category page:", error);
        res.redirect("/pageError");
    }
}




const addCategory = async (req, res) => {

    const { name, description, visibilityStatus, discount } = req.body;
    try {
        let isListed = true;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ error: "Category Already exists" });
        }

        if (visibilityStatus === "active") {
            isListed = true;
        } else {
            isListed = false;
        }

        const newCategory = new Category({
            name,
            description,
            isListed,
            categoryOffer: discount,
        });

        await newCategory.save();
        return res.status(200).json({ message: "Category added successfully" });


    } catch (error) {
        console.log("error in saving category details in dB")
        return res.status(500).json({ error: "Internal Server Error" });
    }
}








module.exports = {
    categoryInfo,
    addCategory,
    loadAddCategory,

}