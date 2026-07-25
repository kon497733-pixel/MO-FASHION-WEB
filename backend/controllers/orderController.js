const Order = require('../models/Order');

// ১. নতুন অর্ডার প্লেস করার জন্য (Checkout পেজ থেকে কল হবে)
const createOrder = async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order Creation Error: ", error);
    res.status(400).json({ message: 'Failed to create order', error: error.message });
  }
};

// ২. অ্যাডমিন প্যানেলে সমস্ত অর্ডার দেখানোর জন্য
const getAllOrders = async (req, res) => {
  try {
    // sort({ createdAt: -1 }) মানে হলো একদম নতুন অর্ডারগুলো সবার উপরে দেখাবে
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ৩. অর্ডারের স্ট্যাটাস আপডেট করার জন্য (অ্যাডমিন প্যানেল থেকে Pending > Delivered করার জন্য)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true } // আপডেট হওয়ার পর নতুন ডাটা রিটার্ন করবে
    );
    
    if (order) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Failed to update status', error: error.message });
  }
};

// 🚀 ৪. ডাটাবেস থেকে অর্ডার সম্পূর্ণ ডিলিট করার জন্য (নতুন ফাংশন)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (order) {
      res.status(200).json({ message: 'Order deleted successfully from database' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  deleteOrder // নতুন ফাংশনটি এক্সপোর্ট করা হলো
};