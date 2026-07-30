const Category = require('../models/Category');

// ১. সব ক্যাটাগরি দেখানোর জন্য (Get all categories)
const getCategories = async (req, res) => {
  try {
    // ডাটাবেস থেকে সব ক্যাটাগরি খুঁজে বের করবে
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ২. নতুন ক্যাটাগরি তৈরি করার জন্য (Create a category)
const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    const createdCategory = await category.save();
    res.status(201).json(createdCategory);
  } catch (error) {
    res.status(400).json({ message: 'Invalid category data', error: error.message });
  }
};

// ৩. ক্যাটাগরি আপডেট/এডিট করার জন্য (Update a category)
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (category) {
      res.status(200).json(category);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid category data', error: error.message });
  }
};

// ৪. ক্যাটাগরি ডিলিট করার জন্য (Delete a category)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (category) {
      res.status(200).json({ message: 'Category removed successfully' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// ফাংশনগুলো এক্সপোর্ট করা হলো
module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};