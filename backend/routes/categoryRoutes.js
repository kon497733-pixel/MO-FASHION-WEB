const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// 🚀 1. সব ক্যাটাগরি ডাটাবেস থেকে নিয়ে আসার API (GET)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ createdAt: -1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories from database', error: error.message });
  }
});

// 🚀 2. আইডি দিয়ে নির্দিষ্ট ক্যাটাগরি নেওয়ার API (GET)
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
});

// 🚀 3. নতুন ক্যাটাগরি ডাটাবেসে সেভ করার API (POST)
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    // নাম আগে থেকে আছে কি না চেক করা (Case-insensitive check)
    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ message: 'A category with this name already exists!' });
    }

    const newCategory = new Category(req.body);
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Error creating category', error: error.message });
  }
});

// 🚀 4. ক্যাটাগরি ডাটা বা ছবি আপডেট করার API (PUT)
router.put('/:id', async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found to update' });
    }
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Error updating category', error: error.message });
  }
});

// 🚀 5. ক্যাটাগরি ডাটাবেস থেকে ডিলিট করার API (DELETE)
router.delete('/:id', async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found to delete' });
    }
    res.status(200).json({ message: 'Category deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
});

module.exports = router;