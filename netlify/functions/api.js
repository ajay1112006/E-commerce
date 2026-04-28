const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection Logic (Cached)
let isConnected = false;
const connectToDatabase = async () => {
  if (isConnected) return;
  
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_db';
  try {
    await mongoose.connect(mongoURI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    // In serverless, we can't easily fallback to in-memory for long, 
    // but we'll let the requests proceed and fail gracefully if they need DB.
  }
};

// Order Schema
const OrderSchema = new mongoose.Schema({
  productName: String,
  price: Number,
  quantity: Number,
  status: { type: String, default: 'PLACED' },
  orderDate: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// Helper for in-memory fallback (Note: this is unreliable in serverless)
let inMemoryOrders = [];

// Endpoints
app.post('/api/orders', async (req, res) => {
  await connectToDatabase();
  const { productName, price, quantity } = req.body;
  const newOrderData = { productName, price, quantity, orderDate: new Date(), status: 'PLACED' };

  try {
    if (mongoose.connection.readyState === 1) {
      const order = new Order(newOrderData);
      await order.save();
      res.status(201).json({ ...order.toObject(), id: order._id.toString() });
    } else {
      newOrderData.id = `mem_${Date.now()}`;
      inMemoryOrders.push(newOrderData);
      res.status(201).json(newOrderData);
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  await connectToDatabase();
  try {
    if (mongoose.connection.readyState === 1) {
      const dbOrders = await Order.find().sort({ orderDate: -1 });
      const normalizedOrders = dbOrders.map(order => ({
        ...order.toObject(),
        id: order._id.toString()
      }));
      res.json(normalizedOrders);
    } else {
      res.json([...inMemoryOrders].reverse());
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  await connectToDatabase();
  const { id } = req.params;
  try {
    if (mongoose.connection.readyState === 1) {
      const deleted = await Order.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Order not found' });
      res.json({ message: 'Order deleted successfully' });
    } else {
      inMemoryOrders = inMemoryOrders.filter(o => o.id !== id);
      res.json({ message: 'Order deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order', error: error.message });
  }
});

module.exports.handler = serverless(app);
