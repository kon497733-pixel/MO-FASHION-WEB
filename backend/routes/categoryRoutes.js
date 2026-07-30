const express = require('express');
const router = express.Router();

// আমাদের তৈরি করা কন্ট্রোলার থেকে ফাংশনগুলো ইমপোর্ট করা হলো
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

// রাউট বা লিংকগুলো সেটআপ করা হলো

// বেসিক রাউট: /api/categories
router.route('/')
  .get(getCategories)    // GET রিকোয়েস্টে সব ক্যাটাগরি দেখাবে
  .post(createCategory); // POST রিকোয়েস্টে নতুন ক্যাটাগরি তৈরি করবে (Admin)

// আইডি যুক্ত রাউট: /api/categories/:id
router.route('/:id')
  .put(updateCategory)    // PUT রিকোয়েস্টে ক্যাটাগরি এডিট/আপডেট করবে (Admin)
  .delete(deleteCategory); // DELETE রিকোয়েস্টে ক্যাটাগরি ডিলিট করবে (Admin)

module.exports = router;