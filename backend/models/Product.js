const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  status: { type: String, default: 'Active' },
  images: [{ type: String }],
  
  // এই ফিল্ডগুলো Optional (বাধ্যতামূলক নয়) করে দিলাম, যাতে ক্র্যাশ না করে
  colors: [{ type: String }],
  sizes: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);