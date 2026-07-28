const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// 🚀 1. সব অর্ডার ডাটাবেস থেকে নিয়ে আসার API (GET) - অ্যাডমিন প্যানেলের জন্য
router.get('/', async (req, res) => {
  try {
    // একদম নতুন অর্ডারগুলো সবার উপরে দেখানোর জন্য createdAt: -1 সর্টিং
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders from database', error: error.message });
  }
});

// 🚀 2. নির্দিষ্ট কোনো একটি অর্ডারের ডিটেইলস নিয়ে আসার API (GET)
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order details', error: error.message });
  }
});

// 🚀 3. কাস্টমারের নতুন অর্ডার ক্লাউড ডাটাবেসে সেভ করার API (POST)
router.post('/', async (req, res) => {
  try {
    // যদি ফ্রন্টএন্ড থেকে অর্ডার আইডি না আসে, তবে অটো-জেনারেট করা (#ORD-12345)
    if (!req.body.orderId) {
      req.body.orderId = `#ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error placing new order', error: error.message });
  }
});

// 🚀 4. অর্ডারের স্ট্যাটাস (Pending, Delivered, Cancelled) আপডেট করার API (PUT)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found to update status' });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order status', error: error.message });
  }
});

// 🚀 5. ক্যানসেল বা পুরনো অর্ডার ডাটাবেস থেকে ডিলিট করার API (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found to delete' });
    }
    res.status(200).json({ message: 'Order deleted successfully from database', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error: error.message });
  }
});

module.exports = router;