const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a payment intent
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, order_id } = req.body;
        const user_id = req.user.user_id;

        const db = req.db;

        // Start transaction
        await db.promise().beginTransaction();

        try {
            // Create a PaymentIntent with Stripe
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    order_id,
                    user_id
                }
            });

            // Create payment record
            await db.promise().execute(
                'INSERT INTO payments (order_id, amount, payment_status, stripe_payment_intent_id) VALUES (?, ?, ?, ?)',
                [order_id, amount, 'PENDING', paymentIntent.id]
            );

            // Update order status
            await db.promise().execute(
                'UPDATE orders SET order_status = ? WHERE order_id = ?',
                ['PROCESSING', order_id]
            );

            await db.promise().commit();

            res.json({
                clientSecret: paymentIntent.client_secret
            });
        } catch (error) {
            await db.promise().rollback();
            throw error;
        }
    } catch (error) {
        console.error('Payment intent creation error:', error);
        res.status(500).json({ message: 'Error creating payment intent', error: error.message });
    }
};

// Handle webhook events from Stripe
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const db = req.db;

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            try {
                await db.promise().beginTransaction();

                // Update payment status
                await db.promise().execute(
                    'UPDATE payments SET payment_status = ? WHERE stripe_payment_intent_id = ?',
                    ['COMPLETED', paymentIntent.id]
                );

                // Get order details
                const [orderRows] = await db.promise().execute(
                    'SELECT order_type FROM orders WHERE order_id = ?',
                    [paymentIntent.metadata.order_id]
                );

                if (orderRows.length > 0) {
                    const order = orderRows[0];
                    
                    if (order.order_type === 'DIRECT_SALE') {
                        // For direct sales, update inventory immediately
                        const [orderProducts] = await db.promise().execute(
                            'SELECT product_id, quantity FROM order_product WHERE order_id = ?',
                            [paymentIntent.metadata.order_id]
                        );

                        for (const item of orderProducts) {
                            await db.promise().execute(
                                'UPDATE product SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                                [item.quantity, item.product_id]
                            );
                        }

                        // Update order status to completed for direct sales
                        await db.promise().execute(
                            'UPDATE orders SET order_status = ? WHERE order_id = ?',
                            ['COMPLETED', paymentIntent.metadata.order_id]
                        );
                    } else if (order.order_type === 'PRODUCTION_ORDER') {
                        // For production orders, create production order entry
                        const [orderProducts] = await db.promise().execute(
                            'SELECT product_id FROM order_product WHERE order_id = ? LIMIT 1',
                            [paymentIntent.metadata.order_id]
                        );

                        if (orderProducts.length > 0) {
                            const [recipeRows] = await db.promise().execute(
                                'SELECT recipe_id FROM recipe WHERE product_id = ?',
                                [orderProducts[0].product_id]
                            );

                            if (recipeRows.length > 0) {
                                await db.promise().execute(
                                    'INSERT INTO production_orders (order_id, recipe_id, production_status, start_time) VALUES (?, ?, ?, NOW())',
                                    [paymentIntent.metadata.order_id, recipeRows[0].recipe_id, 'PENDING']
                                );
                            }
                        }

                        // Update order status to processing for production orders
                        await db.promise().execute(
                            'UPDATE orders SET order_status = ? WHERE order_id = ?',
                            ['PROCESSING', paymentIntent.metadata.order_id]
                        );
                    }
                }

                await db.promise().commit();
            } catch (error) {
                await db.promise().rollback();
                console.error('Error processing payment success:', error);
            }
            break;

        case 'payment_intent.payment_failed':
            try {
                await db.promise().beginTransaction();

                // Update payment status
                await db.promise().execute(
                    'UPDATE payments SET payment_status = ? WHERE stripe_payment_intent_id = ?',
                    ['FAILED', paymentIntent.id]
                );

                // Update order status
                await db.promise().execute(
                    'UPDATE orders SET order_status = ? WHERE order_id = ?',
                    ['CANCELLED', paymentIntent.metadata.order_id]
                );

                await db.promise().commit();
            } catch (error) {
                await db.promise().rollback();
                console.error('Error processing payment failure:', error);
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
}; 