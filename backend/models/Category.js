const mongoose = require('mongoose');

// ক্যাটাগরি ডাটা স্ট্রাকচার বা স্কিমা
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true, // একই নামের দুটি ক্যাটাগরি যেন না হতে পারে
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop',
    },
    images: {
      type: [String], // ক্যাটাগরি স্লাইডশোর জন্য একাধিক ছবি
      default: [],
    },
  },
  {
    timestamps: true, // তৈরি ও আপডেটের তারিখ সেভ রাখার জন্য
  }
);

module.exports = mongoose.model('Category', categorySchema);