const User = require('../../model/userSchema');

// Load transactions page
const loadTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        
        // Filter options
        const filter = req.query.type;
        const search = req.query.search || '';
        
        // Build query
        let query = {};
        
        // Apply type filter if provided and not 'all'
        if (filter && filter !== 'all') {
            query['walletHistory.type'] = filter;
        }
        
        // Apply search filter if provided
        if (search) {
            query['$or'] = [
                { name: { $regex: search, $options: 'i' } },
                { 'walletHistory.transactionId': { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get users with wallet history
        const users = await User.find(query);
        
        // Extract and flatten wallet transactions from all users
        let allTransactions = [];
        users.forEach(user => {
            if (user.walletHistory && user.walletHistory.length > 0) {
                const userTransactions = user.walletHistory.map(transaction => {
                    // Determine payment method based on transaction info
                    let paymentMethod = '-';
                    if (transaction.type === 'purchase' &&  transaction.transactionId) {
                        paymentMethod = 'Net Banking';
                    } else if (transaction.type === 'top-up') {
                        paymentMethod = transaction.note && transaction.note.includes('razorpay') ? 'razorpay' : 'netbanking';
                    } else if (transaction.type === 'refund') {
                        paymentMethod = 'wallet';
                    } else if (transaction.type === 'purchase'){
                        paymentMethod = 'wallet';
                    }
                    
                    return {
                        userId: user._id,
                        userName: user.name,
                        transactionId: transaction.transactionId || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                        date: transaction.date,
                        type: transaction.type,
                        amount: transaction.amount,
                        orderId: transaction.orderId,
                        note: transaction.note,
                        paymentMethod
                    };
                });
                
                // Apply type filter on flattened array if needed
                if (filter && filter !== 'all') {
                    const filteredTransactions = userTransactions.filter(t => t.type === filter);
                    allTransactions = [...allTransactions, ...filteredTransactions];
                } else {
                    allTransactions = [...allTransactions, ...userTransactions];
                }
            }
        });
        
        // Sort transactions by date (newest first)
        allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate total pages
        const totalTransactions = allTransactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);
        
        // Paginate transactions
        const transactions = allTransactions.slice(skip, skip + limit);
        
        res.render('transaction', {
            transactions,
            currentPage: page,
            totalPages,
            filter,
            limit,
            pageTitle:"Transactions"
        });
        
    } catch (error) {
        console.log('Error loading transactions:', error);
        res.status(500).render('error', { message: 'Failed to load transactions' });
    }
};

// Get transaction details
const getTransactionDetails = async (req, res) => {
    try {
        const transactionId = req.query.id;
        
        if (!transactionId) {
            return res.status(400).json({ message: "Transaction ID is required" });
        }
        
        // Find user with the given transaction ID in their wallet history
        const user = await User.findOne({
            'walletHistory.transactionId': transactionId
        });
        
        if (!user) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        
        // Find the specific transaction
        const transaction = user.walletHistory.find(t => t.transactionId === transactionId);
        
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        
        // Format transaction details for response
        const transactionDetails = {
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            transactionId: transaction.transactionId,
            date: transaction.date,
            type: transaction.type,
            amount: transaction.amount,
            orderId: transaction.orderId || null,
            note: transaction.note || null
        };
        
        return res.status(200).json(transactionDetails);
        
    } catch (error) {
        console.log('Error getting transaction details:', error);
        res.status(500).json({ message: "Something went wrong!" });
    }
};

module.exports = {
    loadTransactions,
    getTransactionDetails
};