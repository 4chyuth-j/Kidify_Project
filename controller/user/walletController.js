const User = require("../../model/userSchema");
const Razorpay = require('razorpay');

const crypto = require('crypto');

const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

const initiateWalletTopUp = async (req, res) => {
    try {
        const userId = req.session.user;
        const { amount } = req.body || req.query;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a valid amount' 
            });
        }

        
        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        
        const razorpayAmount = Math.round(amount * 100); // Convert to smallest currency unit (paise)
        
        const options = {
            amount: razorpayAmount,
            currency: 'INR',
            receipt: 'wallet_topup_' + Date.now()
        };

        
        razorpayInstance.orders.create(options, (err, order) => {
            if (!err) {
                return res.status(200).send({
                    success: true,
                    msg: 'Wallet Top-up Initiated',
                    order_id: order.id,
                    amount: razorpayAmount,
                    key_id: RAZORPAY_ID_KEY,
                    product_name: 'Kidify Wallet Top-up',
                    description: 'Add money to Kidify wallet',
                    contact: userData.phone || '',
                    name: userData.name,
                    email: userData.email
                });
            } else {
                return res.status(400).send({ 
                    success: false, 
                    msg: 'Something went wrong while creating the order!' 
                });
            }
        });
    } catch (error) {
        console.log("Error in wallet top-up initiation:", error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to initiate wallet top-up. Please try again.'
        });
    }
};


const verifyAndAddMoneyToWallet = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount
        } = req.body;

        const userId = req.session.user;

        
        const generatedSignature = crypto
            .createHmac('sha256', RAZORPAY_SECRET_KEY)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid payment signature' 
            });
        }

        // Step 2: Update user's wallet balance
        const walletAmount = parseFloat(amount) / 100; // Convert from paise to rupees
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $inc: { wallet: walletAmount },
                $push: {
                    "walletHistory": {
                        amount: walletAmount,
                        type: 'top-up',
                        transactionId: razorpay_payment_id,
                        date: new Date(),
                        note: `Added ₹${walletAmount.toFixed(2)} to wallet`
                    }
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Money added to wallet successfully',
            newBalance: updatedUser.wallet
        });

    } catch (error) {
        console.log("Error in verifying payment and adding money to wallet:", error);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};






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
    initiateWalletTopUp,
    verifyAndAddMoneyToWallet

}