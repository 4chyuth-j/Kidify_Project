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
        console.log("error in saving category details in dB:", error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}



// category blocking
const categoryBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { isListed: false },
            { new: true }
        );

        // Check if the request is an AJAX request
        const isAjaxRequest = req.headers.accept && req.headers.accept.includes('application/json');

        if (isAjaxRequest) {
            // If it's an AJAX request, return JSON response
            return res.status(200).json({
                success: true,
                isListed: updatedCategory.isListed,
                message: "Category blocked successfully"
            });
        } else {
            // If it's a regular request, redirect
            return res.redirect("/admin/category");
        }
    } catch (error) {
        console.log("Error occurred while blocking the Category", error);

        // Check if it's an AJAX request
        const isAjaxRequest = req.headers.accept && req.headers.accept.includes('application/json');

        if (isAjaxRequest) {
            return res.status(500).json({
                success: false,
                message: "Failed to block category"
            });
        } else {
            res.status(500).send("Internal server error");
            return res.redirect("/pageError");
        }
    }
}


// category unblocking
const categoryUnBlocked = async (req, res) => {
    try {
        let id = req.query.id;
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { isListed: true },
            { new: true }
        );

        // Check if the request is an AJAX request
        const isAjaxRequest = req.headers.accept && req.headers.accept.includes('application/json');

        if (isAjaxRequest) {
            // If it's an AJAX request, return JSON response
            return res.status(200).json({
                success: true,
                isListed: updatedCategory.isListed,
                message: "Category unblocked successfully"
            });
        } else {
            // If it's a regular request, redirect
            return res.redirect("/admin/category");
        }
    } catch (error) {
        console.log("Error occurred while Unblocking the Category:", error);

        // Check if it's an AJAX request
        const isAjaxRequest = req.headers.accept && req.headers.accept.includes('application/json');

        if (isAjaxRequest) {
            return res.status(500).json({
                success: false,
                message: "Failed to unblock category"
            });
        } else {
            res.status(500).send("Internal server error");
            return res.redirect("/pageError");
        }
    }
}



// for loading Edit category
const loadEditCategory = async (req, res) => {
    try {

        const id = req.query.id;
        const category = await Category.findOne({ _id: id });
        res.render("edit-category", { category: category, pageTitle: "Edit Category" });

    } catch (error) {
        console.log("Error in loading edit category:", error);
        res.redirect("/pageError");
    }
}



// for Editing category
const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        let isListed = true;
        const { name, description, visibilityStatus, discount } = req.body;
        const existingCategory = await Category.findOne({ name, description, visibilityStatus, discount });

        if (existingCategory) {
            return res.status(400).json({ error: "Category exists, Please make changes" });
        }

        if (visibilityStatus == "active") {
            isListed = true;
        } else {
            isListed = false;
        }

        const updatedCategory = await Category.findByIdAndUpdate(id, {
            name,
            description,
            isListed,
            categoryOffer: discount,

        },
            { new: true });  // This ensures the function returns the updated document, not the old one


        if (updatedCategory) {
            res.redirect("/admin/category");
        } else {
            res.status(404).json({ error: "Category not found" });
        }



    } catch (error) {
        console.log("something went wrong :", error)
        res.status(500).json({ error: "Internal Server error" });

    }
}







module.exports = {
    categoryInfo,
    addCategory,
    loadAddCategory,
    categoryBlocked,
    categoryUnBlocked,
    loadEditCategory,
    editCategory

}