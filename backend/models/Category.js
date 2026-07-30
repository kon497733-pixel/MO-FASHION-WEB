const mongoose = require('mongoose');

// ক্যাটাগরির ডাটাবেস নকশা (Schema)
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  images: [{
    type: String // ক্যাটাগরির স্লাইডশো ছবিগুলোর লিংক এখানে সেভ হবে
  }]
}, {
  timestamps: true // কখন তৈরি হয়েছে তার সময় ধরে রাখবে
});

module.exports = mongoose.model('Category', categorySchema);