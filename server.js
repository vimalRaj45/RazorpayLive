const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_live_R5hlTuJJg2PACA',
  key_secret: 'yAsactzp9aueXEnOoNAgiKx8'
});

// Create Order
app.post('/create-order', async (req, res) => {
  const { amount, currency } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const options = {
    amount: amount * 100,
    currency: currency || 'INR',
    receipt: `receipt_order_${Date.now()}`,
    payment_capture: 1
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Verify Payment
app.post('/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  const hmac = crypto.createHmac('sha256', 'yAsactzp9aueXEnOoNAgiKx8');
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
  const generated_signature = hmac.digest('hex');

  if (generated_signature === razorpay_signature) {
    res.json({ status: 'success', message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ status: 'failure', message: 'Invalid signature' });
  }
});

// Serve index.html from root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
