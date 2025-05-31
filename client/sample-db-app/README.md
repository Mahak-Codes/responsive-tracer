# Sample Database Application

This is a sample application that demonstrates database query logging and latency tracking. It includes a simple e-commerce-like API with products and orders, along with a frontend interface to interact with the API.

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)

## Setup

1. Create a MySQL database:
```sql
CREATE DATABASE sample_db;
```

2. Install dependencies:
```bash
cd sample-db-app
npm install
```

3. Create a `.env` file in the root directory with your database configuration:
```
DB_USER=root
DB_HOST=localhost
DB_NAME=sample_db
DB_PASSWORD=your_password
PORT=3000
```

4. Start the application:
```bash
npm start
```

5. Open `http://localhost:3000/src/index.html` in your browser

## Features

- Product listing and management
- Order creation with stock validation
- Real-time query logging and latency tracking
- Transaction support for order creation
- Automatic database initialization with sample data

## API Endpoints

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/orders` - Create a new order
- `GET /api/orders` - List all orders
- `GET /api/query-logs` - Get database query logs

## Database Query Logging

The application logs all database queries with the following information:
- Timestamp
- Query string
- Parameters
- Execution duration
- Success/failure status

Query logs are stored in `db-queries.log` and can be viewed through the web interface.

## Testing with Responsive Tracer

1. Start the sample application
2. Open the Responsive Tracer tool
3. Enter `http://localhost:3000/src/index.html` in the URL input
4. Click "Analyze Website"
5. Navigate to the "DB Latency" tab to view query performance metrics

## Sample Usage

1. View the list of products
2. Create an order by selecting a product ID and quantity
3. View the order history
4. Monitor query logs and performance metrics 