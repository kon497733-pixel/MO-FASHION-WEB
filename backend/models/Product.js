const mongoose = require('mongoose');

// প্রোডাক্ট ডাটা স্ট্রাকচার বা স্কিমা
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: 'No description provided.',
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: [true, 'Product stock quantity is required'],
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Low Stock', 'Out of Stock', 'Draft'],
      default: 'Active',
    },
    images: {
      type: [String],
      default: ['https://via.placeholder.com/600x600?text=No+Image'],
    },
    sizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    colors: {
      type: [String],
      default: ['Black', 'White', 'Navy Blue', 'Gold'],
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // এটি অটোমেটিক্যালি প্রোডাক্ট কখন তৈরি এবং আপডেট করা হয়েছে তার তারিখ (createdAt, updatedAt) সেভ করবে
  }
);

module.exports = mongoose.model('Product', productSchema);