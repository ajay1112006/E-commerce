const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory fallback if MongoDB fails
let orders = [];

// MongoDB Connection
const mongoURI = 'mongodb://localhost:27017/ecommerce_db';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.warn('MongoDB connection failed. Using in-memory storage instead.');
    console.error(err.message);
  });

// Order Schema (for MongoDB)
const OrderSchema = new mongoose.Schema({
  productName: String,
  price: Number,
  quantity: Number,
  status: { type: String, default: 'PLACED' },
  orderDate: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

// Endpoints
app.post('/api/orders', async (req, res) => {
  const { productName, price, quantity } = req.body;
  const newOrderData = { 
    productName, 
    price, 
    quantity, 
    orderDate: new Date(), 
    status: 'PLACED' 
  };

  try {
    if (mongoose.connection.readyState === 1) {
      const order = new Order(newOrderData);
      await order.save();
      res.status(201).json({ ...order.toObject(), id: order._id.toString() });
    } else {
      // Improved ID generation for in-memory
      newOrderData.id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      orders.push(newOrderData);
      res.status(201).json(newOrderData);
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dbOrders = await Order.find().sort({ orderDate: -1 });
      const normalizedOrders = dbOrders.map(order => ({
        ...order.toObject(),
        id: order._id.toString()
      }));
      res.json(normalizedOrders);
    } else {
      res.json([...orders].reverse());
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id || id === 'undefined') {
    return res.status(400).json({ message: 'Order ID is required' });
  }

  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await Order.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Order not found in DB' });
      res.json({ message: 'Order deleted successfully' });
    } else {
      const initialCount = orders.length;
      orders = orders.filter(order => order.id !== id);
      
      if (orders.length === initialCount) {
        return res.status(404).json({ message: 'Order not found in memory' });
      }
      
      res.json({ message: 'Order deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
