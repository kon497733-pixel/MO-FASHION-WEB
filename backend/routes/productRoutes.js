const express = require('express');
const router = express.Router();

// আমাদের তৈরি করা কন্ট্রোলার থেকে ফাংশনগুলো ইমপোর্ট করা হলো
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// রাউট বা লিংকগুলো সেটআপ করা হলো

// বেসিক রাউট: /api/products
router.route('/')
  .get(getAllProducts)    // GET রিকোয়েস্টে সব প্রোডাক্ট দেখাবে
  .post(createProduct);   // POST রিকোয়েস্টে নতুন প্রোডাক্ট তৈরি করবে (Admin)

// আইডি যুক্ত রাউট: /api/products/:id
router.route('/:id')
  .get(getProductById)    // GET রিকোয়েস্টে নির্দিষ্ট আইডি দিয়ে প্রোডাক্ট দেখাবে
  .put(updateProduct)     // PUT রিকোয়েস্টে প্রোডাক্ট এডিট করবে (Admin)
  .delete(deleteProduct); // DELETE রিকোয়েস্টে প্রোডাক্ট ডিলিট করবে (Admin)

module.exports = router;