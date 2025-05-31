const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'db-queries.log' })
  ]
});

// Database configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sample_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function example() {
  console.log("Start");
  await sleep(5000); // Pause for 2 seconds
  console.log("End");
}

// Query wrapper with logging
async function executeQuery(query, params = []) {
  const startTime = Date.now();
  try {
    await example();
    const [result] = await pool.execute(query, params);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.info({
      timestamp: new Date().toISOString(),
      query,
      params,
      duration,
      success: true
    });

    return {
      rows: result,
      queryStats: {
        duration,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    const endTime = Date.now();
    logger.error({
      timestamp: new Date().toISOString(),
      query,
      params,
      duration: endTime - startTime,
      error: error.message,
      success: false
    });
    throw error;
  }
}

// Initialize database
async function initializeDatabase() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        quantity INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Insert sample data if products table is empty
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM products');
    if (rows[0].count === 0) {
      await executeQuery(`
        INSERT INTO products (name, price, stock) VALUES
        ('Laptop', 999.99, 50),
        ('Smartphone', 499.99, 100),
        ('Headphones', 99.99, 200)
      `);
    }
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes
app.get('/api/products', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Get product details
      const [productResult] = await connection.execute(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [product_id]
      );

      if (productResult.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Product not found' });
      }

      const product = productResult[0];
      if (product.stock < quantity) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({ error: 'Insufficient stock' });
      }

      const total_price = product.price * quantity;

      // Create order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (product_id, quantity, total_price) VALUES (?, ?, ?)',
        [product_id, quantity, total_price]
      );

      // Update stock
      await connection.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [quantity, product_id]
      );

      await connection.commit();
      connection.release();

      // Get the created order
      const [newOrder] = await pool.execute(
        'SELECT * FROM orders WHERE id = ?',
        [orderResult.insertId]
      );

      res.json(newOrder[0]);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT o.*, p.name as product_name 
      FROM orders o 
      JOIN products p ON o.product_id = p.id 
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Query logs endpoint
app.get('/api/query-logs', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT * FROM performance_schema.events_statements_summary_by_digest 
      ORDER BY SUM_TIMER_WAIT DESC 
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDatabase();
}); 