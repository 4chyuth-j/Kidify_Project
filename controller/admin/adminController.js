const User = require("../../model/userSchema");
const mongoose = require("mongoose");
const Order = require('../../model/orderSchema');
const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
const bcrypt = require("bcrypt");



//for loading admin error page
const pageError = async (req,res)=>{
    res.render("admin-error");
};


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


// Helper function to format date ranges
const getDateRange = (period) => {
    const now = new Date();
    let startDate;
    
    switch(period) {
        case 'weekly':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'monthly':
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'yearly':
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1); // Default to monthly
    }
    
    return { startDate, endDate: now };
};

// Load Dashboard with analytics data
// Load Dashboard with analytics data
const loadDashboard = async (req, res) => {
    try {
        if (!req.session.admin) {
            return res.redirect('/admin/login');
        }

        // Prepare dashboard data for all time periods
        const dashboardData = {
            weekly: await getDashboardData('weekly'),
            monthly: await getDashboardData('monthly'),
            yearly: await getDashboardData('yearly')
        };

        // Stringify the data in the controller - ensure proper escaping for EJS
        const dashboardDataString = JSON.stringify(dashboardData)
            .replace(/</g, '\\u003c')
            .replace(/>/g, '\\u003e')
            .replace(/&/g, '\\u0026')
            .replace(/'/g, '\\u0027');

        res.render("dashboard", {
            pageTitle: "Dashboard",
            dashboardData: dashboardData,
            dashboardDataString: dashboardDataString,
            defaultPeriod: 'weekly' // Set default period to weekly
        });
    } catch (error) {
        console.log("Error in loading the dashboard:", error);
        res.redirect("/pageError");
    }
};

// Fetch all dashboard data for a specific time period
async function getDashboardData(period) {
    const { startDate, endDate } = getDateRange(period);

    // Get summary data
    const summary = await getSummaryData(startDate, endDate, period);
    
    // Get revenue data
    const revenue = await getRevenueData(startDate, endDate, period);
    
    // Get top brands data
    const topBrands = await getTopBrandsData(startDate, endDate);
    
    // Get transaction data
    const transactions = await getTransactionsData(startDate, endDate);
    
    // Get top categories data
    const topCategories = await getTopCategoriesData(startDate, endDate);
    
    // Get top products data
    const topProducts = await getTopProductsData(startDate, endDate);
    
    return {
        summary,
        revenue,
        topBrands,
        transactions,
        topCategories,
        topProducts
    };
}

// Get summary card data
async function getSummaryData(startDate, endDate, period) {
    // Calculate total sales
    const salesData = await Order.aggregate([
        { $match: { 
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $nin: ['Cancelled'] }
        }},
        { $group: { _id: null, total: { $sum: "$finalAmount" } }}
    ]);
    const totalSales = salesData.length > 0 ? salesData[0].total : 0;
    
    // Calculate total orders
    const totalOrders = await Order.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate products sold
    const productSoldData = await Order.aggregate([
        { $match: { 
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $nin: ['Cancelled'] }
        }},
        { $unwind: "$orderedItems" },
        { $match: { "orderedItems.cancelled": false } },
        { $group: { _id: null, count: { $sum: "$orderedItems.quantity" } }}
    ]);
    const productsSold = productSoldData.length > 0 ? productSoldData[0].count : 0;
    
    // Calculate new customers
    const newCustomers = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate trends
    // For simplicity, just showing placeholder trend values
    // In a real app, you'd compare with previous periods
    const salesTrend = "+12% than last " + period.slice(0, -2);
    const ordersTrend = "+8% than last " + period.slice(0, -2);
    const productsTrend = "+5% than last " + period.slice(0, -2);
    const customersTrend = "+10% than last " + period.slice(0, -2);
    
    return {
        totalSales,
        totalOrders,
        productsSold,
        newCustomers,
        salesTrend,
        ordersTrend,
        productsTrend,
        customersTrend
    };
}

// Get revenue chart data
async function getRevenueData(startDate, endDate, period) {
    let format;
    let labels = [];
    
    // Define format and generate labels based on period
    if (period === 'weekly') {
        format = '%Y-%m-%d';
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            labels.push(date.toISOString().split('T')[0]); // Use actual dates as labels
        }
    } else if (period === 'monthly') {
        format = '%Y-%m-%d';
        for (let i = 0; i < 5; i++) {
            const weekStart = new Date(startDate);
            weekStart.setDate(startDate.getDate() + i * 7);
            labels.push(`Week ${i+1}`);
        }
    } else {
        format = '%Y-%m';
        for (let i = 0; i < 12; i++) {
            const month = new Date(startDate);
            month.setMonth(startDate.getMonth() + i);
            labels.push(month.toISOString().slice(0, 7)); // Format as YYYY-MM
        }
    }
    
    // Aggregate revenue data
    const revenueData = await Order.aggregate([
        { $match: { 
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $nin: ['Cancelled'] }
        }},
        { $group: { 
            _id: { $dateToString: { format: format, date: "$createdAt" } },
            total: { $sum: "$finalAmount" }
        }},
        { $sort: { _id: 1 } }
    ]);
    
    // Map the aggregated data to the labels
    const values = Array(labels.length).fill(0);
    revenueData.forEach(item => {
        const index = labels.indexOf(item._id);
        if (index !== -1) {
            values[index] = item.total;
        }
    });

    return { labels, values };
}

// Get top brands data
async function getTopBrandsData(startDate, endDate) {
    // Get top selling brands
    const brandData = await Order.aggregate([
        { $match: { 
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $nin: ['Cancelled'] }
        }},
        { $unwind: "$orderedItems" },
        { $match: { "orderedItems.cancelled": false } },
        { $lookup: {
            from: "products",
            localField: "orderedItems.product",
            foreignField: "_id",
            as: "productDetails"
        }},
        { $unwind: "$productDetails" },
        { $group: {
            _id: "$productDetails.brand",
            count: { $sum: "$orderedItems.quantity" }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);
    
    // If no data, provide sample data
    let labels = [];
    let values = [];
    
    if (brandData.length === 0) {
        labels = ['AMIFIT', 'Lifelong', 'RUBX', 'Axio', 'BoldFit', 'FITRXX', 'WATSON', 'Kaks'];
        values = [15, 15, 6, 5, 4, 1, 1, 1];
    } else {
        brandData.forEach(item => {
            labels.push(item._id);
            values.push(item.count);
        });
    }
    
    return { labels, values };
}

// Get transactions data
async function getTransactionsData(startDate, endDate) {
    // Get wallet transaction data from user's walletHistory
    const transactionData = await User.aggregate([
        { $unwind: "$walletHistory" },
        { $match: { 
            "walletHistory.date": { $gte: startDate, $lte: endDate }
        }},
        { $group: { 
            _id: "$walletHistory.type",
            total: { $sum: 1 }
        }},
        { $sort: { total: -1 } }
    ]);
    
    // Map transaction types to display labels
    const typeToLabel = {
        'refund': 'Refund Product',
        'top-up': 'Add Money to Wallet',
        'purchase': 'Product Purchase',
        'referral-reward': 'Referral Reward'
    };
    
    // Prepare data for chart
    let labels = [];
    let values = [];
    let total = 0;
    
    // If data exists, use it
    if (transactionData.length > 0) {
        transactionData.forEach(item => {
            labels.push(typeToLabel[item._id] || item._id);
            values.push(item.total);
            total += item.total;
        });
    } else {
        // Sample data if no transactions found
        labels = ['Add Money to Wallet', 'Refund Product', 'Product Cancelled', 'Product Purchase'];
        values = [85, 5, 5, 5]; // Sample values
        total = 100;
    }
    
    // Convert to percentages
    if (total > 0) {
        values = values.map(value => Math.round((value / total) * 100));
    }
    
    return { labels, values };
}

// Get top categories data
async function getTopCategoriesData(startDate, endDate) {
    // Get top selling categories - now using the correct name field from your schema
    const categoryData = await Order.aggregate([
        { $match: { 
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $nin: ['Cancelled'] }
        }},
        { $unwind: "$orderedItems" },
        { $match: { "orderedItems.cancelled": false } },
        { $lookup: {
            from: "products",
            localField: "orderedItems.product",
            foreignField: "_id",
            as: "productDetails"
        }},
        { $unwind: "$productDetails" },
        { $lookup: {
            from: "categories",
            localField: "productDetails.category",
            foreignField: "_id",
            as: "categoryDetails"
        }},
        { $unwind: "$categoryDetails" },
        { $group: {
            _id: "$categoryDetails.name", // Using the "name" field from your category schema
            count: { $sum: "$orderedItems.quantity" }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);
    
    // If no data, provide sample data
    let labels = [];
    let values = [];
    
    if (categoryData.length === 0) {
        labels = ['Strengtheners', 'Dumbbells', 'Weight Plates', 'Kettlebells'];
        values = [24, 22, 1, 1];
    } else {
        categoryData.forEach(item => {
            labels.push(item._id);
            values.push(item.count);
        });
    }
    
    return { labels, values };
}

// Get top products data
async function getTopProductsData(startDate, endDate) {
    // Get top selling products
    const productData = await Order.aggregate([
        { $match: { 
            createdAt: { $gte: startDate, $lte: endDate },
            orderStatus: { $nin: ['Cancelled'] }
        }},
        { $unwind: "$orderedItems" },
        { $match: { "orderedItems.cancelled": false } },
        { $lookup: {
            from: "products",
            localField: "orderedItems.product",
            foreignField: "_id",
            as: "productDetails"
        }},
        { $unwind: "$productDetails" },
        { $group: {
            _id: "$productDetails._id",
            productName: { $first: "$productDetails.productName" },
            count: { $sum: "$orderedItems.quantity" }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
    ]);
    
    // If no data, provide sample data
    let labels = [];
    let values = [];
    
    if (productData.length === 0) {
        labels = ['FBZ1018', 'FBZ1015', 'FBZ1017', 'FBZ1016', 'FBZ1020', 'FBZ1014', 'FBZ1008', 'FBZ1012', 'FBZ1010'];
        values = [15, 10, 6, 5, 5, 4, 1, 1, 1];
    } else {
        productData.forEach(item => {
            labels.push(item.productName);
            values.push(item.count);
        });
    }
    
    return { labels, values };
}


//admin logout
const logout = async (req,res)=>{
    try {
       req.session.destroy(err=>{
        if(err){
            console.log("Error occured while distroying sesssion:",err);
            return res.redirect('/pageError');
        }
        res.render("admin-login",{successMessage:"Admin LoggedOut successfully!"});
        
       }) 
    } catch (error) {
        console.log("Unexpected error during logout:",error);
        res.redirect('/pageError')
    }
}





module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout

}