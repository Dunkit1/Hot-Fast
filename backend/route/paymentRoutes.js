const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/AuthMiddleware');
const {
    createPaymentIntent,
    handleWebhook
} = require('../controller/paymentController');

// Create payment intent (protected route)
router.post('/create-payment-intent', authenticateUser, createPaymentIntent);

// Stripe webhook (no authentication needed, but requires raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router; 