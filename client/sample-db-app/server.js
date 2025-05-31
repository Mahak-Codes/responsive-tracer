require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('../db');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Products endpoints
app.get('/api/products', async (req, res) => {
    try {
        const products = await db.getProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Orders endpoints
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.getOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        
        if (!product_id || !quantity) {
            return res.status(400).json({ error: 'Product ID and quantity are required' });
        }

        const order = await db.createOrder(product_id, quantity);
        res.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Query logs endpoint
app.get('/api/query-logs', (req, res) => {
    try {
        const logs = db.getQueryLogs();
        res.json(logs);
    } catch (error) {
        console.error('Error fetching query logs:', error);
        res.status(500).json({ error: 'Failed to fetch query logs' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Database server running on port ${PORT}`);
}); 