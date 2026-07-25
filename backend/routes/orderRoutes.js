const express = require('express');
const router = express.Router();

// আমাদের তৈরি করা কন্ট্রোলার থেকে ফাংশনগুলো ইমপোর্ট করা হলো
const {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  deleteOrder // 🚀 নতুন ডিলিট ফাংশন ইমপোর্ট করা হলো
} = require('../controllers/orderController');

// রাউট বা লিংকগুলো সেটআপ করা হলো

// বেসিক রাউট: /api/orders
router.route('/')
  .post(createOrder)   // POST রিকোয়েস্ট: কাস্টমার চেকআউট থেকে নতুন অর্ডার প্লেস করবে
  .get(getAllOrders);  // GET রিকোয়েস্ট: অ্যাডমিন প্যানেলে সমস্ত অর্ডার দেখাবে

// আইডি যুক্ত রাউট: /api/orders/:id/status
router.route('/:id/status')
  .put(updateOrderStatus); // PUT রিকোয়েস্ট: অ্যাডমিন অর্ডারের স্ট্যাটাস পরিবর্তন করবে

// 🚀 নতুন ডিলিট রাউট: /api/orders/:id
router.route('/:id')
  .delete(deleteOrder); // DELETE রিকোয়েস্ট: ডাটাবেস থেকে অর্ডার ডিলিট করবে

module.exports = router;