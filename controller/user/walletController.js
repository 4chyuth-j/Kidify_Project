const User = require("../../model/userSchema");

const loadWalletPage = async (req, res) => {
    try {
        const userId = req.session.user;
        const userDetails = await User.findOne({ _id: userId }).lean();

        if (!userDetails) {
            console.log("User Details not found");
            return res.status(404).send("User not found");
        }

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = 3; // Number of transactions per page
        
        // Search functionality
        let query = req.query.search || '';
        const searchQuery = query.trim();
        
        // Filter wallet history based on search
        let filteredHistory = userDetails.walletHistory || [];
        
        if (searchQuery) {
            // Search in transaction ID, order ID, type, and note fields
            filteredHistory = filteredHistory.filter(transaction => 
                (transaction.transactionId && transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (transaction.orderId && transaction.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (transaction.type && transaction.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (transaction.note && transaction.note.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        
        // Sort by date (newest first)
        filteredHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate pagination values
        const totalTransactions = filteredHistory.length;
        const totalPages = Math.ceil(totalTransactions / limit);
        
        // Get current page transactions
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const currentTransactions = filteredHistory.slice(startIndex, endIndex);
        
        res.render("wallet-Transaction", {
            user: userDetails,
            walletHistory: currentTransactions,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery
        });

    } catch (error) {
        console.error("Error loading wallet page:", error);
        return res.status(500).send("Something went wrong");
    }
}
module.exports = {
    loadWalletPage,

}