const createOrder = async (req, res) => {
    const db = req.db;
    
    try {
        const { items, shipping_address, order_type = 'DIRECT_SALE' } = req.body;
        const user_id = req.user.user_id;

        await db.promise().beginTransaction();

        try {
            // Calculate total amount
            let total_amount = 0;
            for (const item of items) {
                const [rows] = await db.promise().execute(
                    'SELECT selling_price FROM product WHERE product_id = ?',
                    [item.product_id]
                );
                if (rows.length > 0) {
                    total_amount += rows[0].selling_price * item.quantity;
                }
            }

            // Create order
            const [orderResult] = await db.promise().execute(
                'INSERT INTO orders (user_id, order_type, order_status, date, address, total_amount) VALUES (?, ?, ?, NOW(), ?, ?)',
                [user_id, order_type, 'PENDING', JSON.stringify(shipping_address), total_amount]
            );

            const order_id = orderResult.insertId;

            // Insert order items
            for (const item of items) {
                // Get the selling price from product table
                const [productRows] = await db.promise().execute(
                    'SELECT selling_price FROM product WHERE product_id = ?',
                    [item.product_id]
                );
                
                if (productRows.length > 0) {
                    await db.promise().execute(
                        'INSERT INTO order_product (order_id, product_id, quantity) VALUES (?, ?, ?)',
                        [order_id, item.product_id, item.quantity]
                    );
                }
            }

            await db.promise().commit();

            res.status(201).json({
                message: 'Order created successfully',
                order_id,
                total_amount
            });
        } catch (error) {
            await db.promise().rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

const getAllOrders = async (req, res) => {
    const db = req.db;
    const user_id = req.user.user_id;
    
    try {
        // Get all orders for the user
        const [orders] = await db.promise().execute(
            'SELECT o.*, p.payment_status, p.payment_method FROM orders o LEFT JOIN payments p ON o.order_id = p.order_id WHERE o.user_id = ?',
            [user_id]
        );

        // Get items for all orders
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [itemRows] = await db.promise().execute(
                'SELECT op.*, p.product_name, p.image_url FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
                [order.order_id]
            );

            // If it's a production order, get production status
            let productionStatus = null;
            if (order.order_type === 'PRODUCTION_ORDER') {
                const [productionRows] = await db.promise().execute(
                    'SELECT production_status, start_time, completion_time FROM production_orders WHERE order_id = ?',
                    [order.order_id]
                );
                if (productionRows.length > 0) {
                    productionStatus = productionRows[0];
                }
            }

            return {
                ...order,
                items: itemRows,
                production_status: productionStatus,
                shipping_address: order.address ? JSON.parse(order.address) : null
            };
        }));

        res.json(ordersWithItems);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

const getOrder = async (req, res) => {
    const db = req.db;
    
    try {
        const { orderId } = req.params;
        const user_id = req.user.user_id;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        // Get order details
        const [orderRows] = await db.promise().execute(
            'SELECT o.*, p.payment_status, p.payment_method FROM orders o LEFT JOIN payments p ON o.order_id = p.order_id WHERE o.order_id = ? AND o.user_id = ?',
            [orderId, user_id]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orderRows[0];

        // Get order items
        const [itemRows] = await db.promise().execute(
            'SELECT op.*, p.product_name, p.image_url FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
            [orderId]
        );

        // If it's a production order, get production status
        let productionStatus = null;
        if (order.order_type === 'PRODUCTION_ORDER') {
            const [productionRows] = await db.promise().execute(
                'SELECT production_status, start_time, completion_time FROM production_orders WHERE order_id = ?',
                [orderId]
            );
            if (productionRows.length > 0) {
                productionStatus = productionRows[0];
            }
        }

        res.json({
            ...order,
            items: itemRows,
            production_status: productionStatus,
            shipping_address: order.address ? JSON.parse(order.address) : null
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
};

const getUserOrders = async (req, res) => {
    const db = req.db;
    
    try {
        const user_id = req.user.user_id;

        const [orders] = await db.promise().execute(
            `SELECT o.*, 
                    p.payment_status,
                    po.production_status
             FROM orders o 
             LEFT JOIN payments p ON o.order_id = p.order_id 
             LEFT JOIN production_orders po ON o.order_id = po.order_id 
             WHERE o.user_id = ?
             ORDER BY o.date DESC`,
            [user_id]
        );

        // Get items for each order
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await db.promise().execute(
                'SELECT op.*, p.product_name, p.image_url FROM order_product op JOIN product p ON op.product_id = p.product_id WHERE op.order_id = ?',
                [order.order_id]
            );

            return {
                ...order,
                items,
                shipping_address: JSON.parse(order.address)
            };
        }));

        res.json(ordersWithItems);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Error fetching user orders', error: error.message });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrder,
    getUserOrders
}; 