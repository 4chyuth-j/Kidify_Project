const Product = require("../../model/productSchema");
const Category = require("../../model/categorySchema");




const loadAddProduct = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });
    return res.render("addProducts", { pageTitle: "Add Product", categories: category });
  } catch (error) {
    console.log("Error in loading add product page:", error);
    res.redirect("/pageError");
  }

}

//adding product in db
const addProducts = async (req, res) => {
  try {

    const products = req.body;
    console.log(req.body);
    const productExists = await Product.findOne({
      productName: products.productName,
    });

    if (!productExists) {

      const images = [];

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          images.push(req.files[i].filename);
        }
      }

      const categoryId = await Category.findOne({ _id: products.category });

      if (!categoryId) {
        console.log(categoryId);
        return res.status(400).json({ error: "Invalid category" });
      }


      const basePrice = parseFloat(products.basePrice); // Ensure it's a number

      const newProduct = new Product({
        productName: products.productName,
        description: products.description,
        brand: products.brand,
        category: categoryId._id,
        basePrice: basePrice,
        discountPercentage: products.discountPercentage,
        stock: products.stock,
        productImage: images,
        status: "Available",

      });

      await newProduct.save();
      console.log("product saved in db successfully");
      return res.status(200).json({ message: "Product Added Successfully!!" });


    } else {
      return res.status(400).json({ error: "Product already exist, please try with another Name" });
    }

  } catch (error) {
    console.error("Error saving product", error);
    return res.render("admin-error", { pageTitle: "Page Not found!" });
  }
}


//product listing
const viewProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 4;

    const productData = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },

      ],
    }).sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('category')
      .exec();

    const count = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } }
      ],
    }).countDocuments();

    const category = await Category.find({ isListed: true });

    if (category) {
      res.render("products", {
        pageTitle: "Products",
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,

      });
    } else {
      res.render("admin-error", { pageTitle: "Page Not found!" });

    }

  } catch (error) {
    console.log("something went wrong:",error)
    res.redirect("/pageError");
  }
};


//adding product offer
const addProductOffer = async (req, res) => {
  try {
    const { discountPercentage, productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Validate discount percentage
    if (!discountPercentage || isNaN(discountPercentage) || discountPercentage < 0) {
      return res.status(400).json({ error: "Invalid discount percentage" });
    }



    const productExist = await Product.findOne({ _id: productId });

    if (!productExist) {
      console.log("error in finding the product for adding offer");  //debugging step
      return res.status(400).json({ error: "Failed to locate the product" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { discountPercentage },
      { new: true } // Returns the updated document
    );


    if (!updatedProduct) {
      return res.status(400).json({ error: "Failed to update product offer" });
    }


    return res.status(200).json({ message: "Product Offer added successfully!" });

  } catch (error) {
    console.error("Something went wrong while adding offer", error);
    return res.status(500).json({ error: "Internal server Error" });

  }
}



//remove product offer
const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const productExist = await Product.findOne({ _id: productId });

    if (!productExist) {
      console.log("error in finding the product for removing the offer");  //debugging step
      return res.status(400).json({ error: "Failed to locate the product" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { discountPercentage: 0 },
      { new: true } // Returns the updated document
    );


    if (!updatedProduct) {
      return res.status(400).json({ error: "Failed to update product offer" });
    }


    return res.status(200).json({ message: "Product Offer Removed successfully!" });

  } catch (error) {

    console.error("Something went wrong while removing offer", error);

    return res.status(500).json({ error: "Internal server Error" });

  }
}


//product blocking
const blockProduct = async (req, res) => {

  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const productExist = await Product.findOne({ _id: productId });

    if (!productExist) {
      console.log("error in finding the product for blocking the product");  //debugging step
      return res.status(400).json({ error: "Failed to block the product" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { isBlocked: true },
      { new: true } // Returns the updated document
    );


    if (!updatedProduct) {
      return res.status(400).json({ error: "Failed to block the product" });
    }


    return res.status(200).json({ message: "Product Blocked successfully!" });


  } catch (error) {
    console.error("Something went wrong while blocking ", error);

    return res.status(500).json({ error: "Internal server Error" });

  }



}


//product unblocking
const unBlockProduct = async (req, res) => {
  try {

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const productExist = await Product.findOne({ _id: productId });

    if (!productExist) {
      console.log("error in finding the product for Unblocking the product");  //debugging step
      return res.status(400).json({ error: "Failed to Unblock the product" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { isBlocked: false },
      { new: true } // Returns the updated document
    );


    if (!updatedProduct) {
      return res.status(400).json({ error: "Failed to Unblock the product" });
    }


    return res.status(200).json({ message: "Product UnBlocked successfully!" });



  } catch (error) {

    console.error("Something went wrong while Unblocking ", error);

    return res.status(500).json({ error: "Internal server Error" });
  }
}



const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findOne({ _id: id });
    const category = await Category.find({});
    if (!product) {
      console.log("product not found for edit product display");
      return res.render("admin-error", { pageTitle: "Page Not found!" });
    }
    res.render("editProduct", { pageTitle: "Edit Product", product: product, cat: category });
  } catch (error) {
    console.log("something went wrong while loading edit product:",error);
    res.redirect("/pageError");
  }
}



//editProduct
const editProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    
    const {
      productName,
      description,
      category,
      basePrice,
      discountPercentage,
      stock,
      brand,
      existingImages,
      deletedImages
    } = req.body;

    
    const categoryId = await Category.findOne({ _id: category });
    if (!categoryId) {
      return res.status(400).json({ error: "Invalid category" });
    }

    
    const productWithSameName = await Product.findOne({
      productName: productName,
      _id: { $ne: productId } // Exclude current product from check
    });

    if (productWithSameName) {
      return res.status(400).json({
        error: "Product name already exists, please choose another name"
      });
    }

    // Process images
    let updatedImages = [];

    // Keep existing images that weren't deleted
    if (existingImages) {
      // Handle case when existingImages is a single value or an array
      const existingImagesArray = Array.isArray(existingImages)
        ? existingImages
        : [existingImages];

      // Handle case when deletedImages is a single value, an array, or undefined
      const deletedImagesArray = deletedImages
        ? (Array.isArray(deletedImages) ? deletedImages : [deletedImages])
        : [];

      // Filter out deleted images
      updatedImages = existingImagesArray.filter(
        img => !deletedImagesArray.includes(img)
      );
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.filename);
      updatedImages = [...updatedImages, ...newImages];
    }

    // Ensure there's at least one image
    if (updatedImages.length === 0) {
      return res.status(400).json({ error: "At least one product image is required" });
    }

    // Update product
    existingProduct.productName = productName;
    existingProduct.description = description;
    existingProduct.brand = brand;
    existingProduct.category = categoryId._id;
    existingProduct.basePrice = parseFloat(basePrice);
    existingProduct.discountPercentage = discountPercentage !== ""
      ? parseFloat(discountPercentage)
      : 0;
    existingProduct.stock = parseInt(stock);
    existingProduct.productImage = updatedImages;

    await existingProduct.save();

    // Return success response
    return res.status(200).json({
      message: "Product updated successfully",
      product: existingProduct
    });

  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      error: "An error occurred while updating the product"
    });
  }
};






module.exports = {
  loadAddProduct,
  addProducts,
  viewProducts,
  addProductOffer,
  removeProductOffer,
  blockProduct,
  unBlockProduct,
  loadEditProduct,
  editProduct,
}