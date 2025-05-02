const User = require("../../model/userSchema");
const Product = require("../../model/productSchema");
const Order = require("../../model/orderSchema");

const loadReportPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        
        // Initialize filter object
        let filter = {};
        let filterQuery = "";
        
        // Process payment method filter
        if (req.query.payment) {
            filter.paymentMethod = req.query.payment;
            filterQuery += `&payment=${req.query.payment}`;
        }
        
        // Process date filter based on selection
        const dateFilter = req.query.dateFilter;
        if (dateFilter) {
            filterQuery += `&dateFilter=${dateFilter}`;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            switch (dateFilter) {
                case 'daily':
                    // Filter for today
                    const endOfDay = new Date(today);
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    filter.createdAt = { 
                        $gte: today,
                        $lte: endOfDay
                    };
                    break;
                    
                case 'weekly':
                    // Filter for current week (last 7 days)
                    const weekStartDate = new Date(today);
                    weekStartDate.setDate(weekStartDate.getDate() - 6); // Last 7 days including today
                    
                    filter.createdAt = { 
                        $gte: weekStartDate,
                        $lte: new Date(today.setHours(23, 59, 59, 999))
                    };
                    break;
                    
                case 'yearly':
                    // Filter for current year
                    const yearStartDate = new Date(today.getFullYear(), 0, 1);
                    const yearEndDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
                    
                    filter.createdAt = { 
                        $gte: yearStartDate,
                        $lte: yearEndDate
                    };
                    break;
                    
                case 'custom':
                    // Custom date range - process start and end dates
                    if (req.query.startDate) {
                        const startDate = new Date(req.query.startDate);
                        startDate.setHours(0, 0, 0, 0);
                        filter.createdAt = { $gte: startDate };
                        filterQuery += `&startDate=${req.query.startDate}`;
                    }
                    
                    if (req.query.endDate) {
                        const endDate = new Date(req.query.endDate);
                        endDate.setHours(23, 59, 59, 999);
                        
                        if (filter.createdAt) {
                            filter.createdAt.$lte = endDate;
                        } else {
                            filter.createdAt = { $lte: endDate };
                        }
                        
                        filterQuery += `&endDate=${req.query.endDate}`;
                    }
                    break;
            }
        } else {
            
        }
        
        // filter for completed orders only (not cancelled ) returned orders not included because the company still has the money in the user wallet
        filter.orderStatus = { $nin: ['Cancelled','Returned'] };
        // filter.paymentStatus = {$in:['Paid']};
        
      
        const totalOrders = await Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limit);
        
        
        const orders = await Order.find(filter)
            .populate({
                path: 'orderedItems.product',
                select: 'title'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        // Calculating sales statistics based on filter
        const allFilteredOrders = await Order.find(filter);
        
        const stats = {
            totalOrders: totalOrders,
            totalAmount: 0,
            totalDiscounts: 0,
            netSales: 0
        };
        
        // Calculating statistics from all filtered orders
        allFilteredOrders.forEach(order => {
            stats.totalAmount += order.totalPrice;
            stats.totalDiscounts += (order.totalPrice - order.finalAmount);
            stats.netSales += order.finalAmount;
        });
        
        // Create filter object to pass to view
        const viewFilter = {
            payment: req.query.payment || '',
            dateFilter: req.query.dateFilter || '',
            startDate: req.query.startDate || '',
            endDate: req.query.endDate || ''
        };
        
        return res.render("salesReport", { 
            pageTitle: "Sales Report",
            orders: orders,
            currentPage: page,
            totalPages: totalPages,
            stats: stats,
            filter: viewFilter,
            filterQuery: filterQuery
        });
        
    } catch (error) {
        console.log("Error in loading sales report page:", error);
        res.redirect("/pageError");
    }
};

// Dummy controller function for download routes (to be implemented later)
const downloadSalesReport = async (req, res) => {
    try {
        const format = req.query.format; // 'pdf' or 'excel'
        
        // This is just a placeholder - you would implement actual PDF/Excel generation here
        if (format === 'pdf') {
            // Send a dummy response for now
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
            res.send('PDF Report would be generated here');
        } else if (format === 'excel') {
            // Send a dummy response for now
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx');
            res.send('Excel Report would be generated here');
        } else {
            res.status(400).send('Invalid format specified');
        }
    } catch (error) {
        console.log("Error downloading sales report:", error);
        res.status(500).send('Error generating report');
    }
};

module.exports = {
    loadReportPage,
    downloadSalesReport
};