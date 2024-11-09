// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_API_KEY); // Use Stripe API key from environment variables

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Example route to check subscription status
app.post('/check-subscription', async (req, res) => {
    const { userId } = req.body;

    try {
        // Your logic to check if user has an active subscription
        // Example (assuming you have user subscription logic):
        const customer = await stripe.customers.retrieve(userId);
        const subscriptions = customer.subscriptions?.data || [];

        const activeSubscription = subscriptions.some(
            (sub) => sub.status === 'active'
        );

        if (activeSubscription) {
            res.json({ message: 'Thank you for being a premium member!' });
        } else {
            res.json({ message: 'Please subscribe to access premium features.' });
        }
    } catch (error) {
        console.error('Error checking subscription:', error);
        res.status(500).json({ error: 'Failed to check subscription status' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
