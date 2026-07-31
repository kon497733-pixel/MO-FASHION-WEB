const mongoose = require('mongoose');

// প্রোডাক্টের ডাটাবেস নকশা (Schema)
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // 🚀 ডিসকাউন্ট পার্মানেন্টলি সেভ রাখার জন্য
  discount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    default: 'Active'
  },
  images: [{
    type: String // ছবির লিংকগুলো এখানে সেভ হবে
  }],
  imageUrl: {
    type: String
  },
  
  // 🚀 আপনার ইচ্ছামতো ডাইনামিক অপশন (Variants) সেভ করার জন্য নতুন ফিল্ড
  variants: [{
    name: { type: String },
    options: [{ type: String }]
  }],

  // পুরোনো সাপোর্টের জন্য
  sizes: [{ type: String }],
  colors: [{ type: String }],
  rating: {
    type: Number,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // প্রোডাক্ট কখন তৈরি বা আপডেট হয়েছে তার সময় সেভ রাখবে
});

module.exports = mongoose.model('Product', productSchema);