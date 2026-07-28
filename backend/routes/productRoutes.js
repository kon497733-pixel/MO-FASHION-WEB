const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// 🚀 1. সব প্রোডাক্ট ডাটাবেস থেকে নিয়ে আসার API (GET)
router.get('/', async (req, res) => {
  try {
    // নতুন প্রোডাক্ট সবার উপরে দেখানোর জন্য createdAt: -1 দিয়ে সর্ট করা হলো
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products from database', error: error.message });
  }
});

// 🚀 2. আইডি দিয়ে নির্দিষ্ট একটি প্রোডাক্ট ডাটাবেস থেকে খোঁজার API (GET)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found in database' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
});

// 🚀 3. নতুন প্রোডাক্ট ক্লাউড ডাটাবেসে সেভ করার API (POST)
router.post('/', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error saving product to database', error: error.message });
  }
});

// 🚀 4. প্রোডাক্টের ডাটা এডিট/আপডেট করার API (PUT)
router.put('/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found to update' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
});

// 🚀 5. প্রোডাক্ট ডাটাবেস থেকে ডিলিট করার API (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found to delete' });
    }
    res.status(200).json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
});

module.exports = router;