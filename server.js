// server.js (Node.js server)

const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');
const app = express();
app.use(cors());

const stripe = new Stripe('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'); // Replace with your Stripe Secret Key

// Endpoint to check subscription status
app.get('/check-subscription', async (req, res) => {
  try {
    const customerId = req.query.customerId; // Receive customer ID from the client
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });
    const isSubscribed = subscriptions.data.length > 0; // true if active subscriptions exist
    res.json({ subscribed: isSubscribed });
  } catch (error) {
    res.status(500).send('Error checking subscription');
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
