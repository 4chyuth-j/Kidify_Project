const express = require("express");
const router = express.Router();
const adminController = require("../controller/admin/adminController.js");
const customerController = require('../controller/admin/customerController.js');
const categoryController = require('../controller/admin/categoryController.js');
const productController = require('../controller/admin/productController.js');
const bannerController = require('../controller/admin/bannerController.js');
const orderController = require('../controller/admin/orderController.js');
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({storage:storage});

const {userAuth,adminAuth} = require("../middlewares/auth.js");


router.get("/login",adminController.loadLogin);

router.post("/login",adminController.login);

router.get("/",adminAuth,adminController.loadDashboard);

router.get("/logout",adminController.logout);


//customer Management

router.get("/users",adminAuth,customerController.customerInfo);

router.get("/blockCustomer",adminAuth,customerController.customerBlocked);

router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked);

router.get("/pageError",adminAuth,adminController.pageError);


//catergory management

router.get("/category",adminAuth,categoryController.categoryInfo);

router.get("/addCategory",adminAuth,categoryController.loadAddCategory);

router.post("/addCategory",adminAuth,categoryController.addCategory);

router.get("/blockCategory",adminAuth,categoryController.categoryBlocked);

router.get("/unblockCategory",adminAuth,categoryController.categoryUnBlocked);

router.get("/editCategory",adminAuth,categoryController.loadEditCategory);

router.post("/editCategory/:id",adminAuth,categoryController.editCategory);


//product Management

router.get("/addProducts",adminAuth,productController.loadAddProduct);

router.post("/addProducts",adminAuth,uploads.array("variantImages",4),productController.addProducts);

router.get("/products",adminAuth,productController.viewProducts);

router.post("/addProductOffer",adminAuth,productController.addProductOffer);

router.post("/removeProductOffer",adminAuth,productController.removeProductOffer);

router.post("/blockProduct",adminAuth,productController.blockProduct);

router.post("/unBlockProduct",adminAuth,productController.unBlockProduct);

router.get("/editproduct",adminAuth,productController.loadEditProduct);

router.put('/editproduct/:id', uploads.array('variantImages',4), productController.editProduct);

// banner managment
router.get("/banner",adminAuth,bannerController.loadBannerPage);

router.get("/addBanner",adminAuth,bannerController.getAddBannerPage);

router.post("/addBanner",adminAuth,uploads.single("images"),bannerController.addBanner);


//order management
router.get("/orders",adminAuth,orderController.loadOrders);

router.get('/order-details',adminAuth,orderController.loadOrderDetails);

router.post('/update-order-status',adminAuth,orderController.updateOrderStatus)

router.post('/process-return-request',adminAuth,orderController.processReturnRequest);



module.exports = router;

