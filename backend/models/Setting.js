const mongoose = require('mongoose');

// গ্লোবাল স্টোর সেটিংস ডাটা স্ট্রাকচার বা স্কিমা
const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'MO FASHION',
    },
    logoUrl: {
      type: String,
      default: '', // লোগোর ইমেজ URL
    },
    tagline: {
      type: String,
      default: 'Premium E-Commerce Experience',
    },
    contactEmail: {
      type: String,
      default: 'support@mofashion.com',
    },
    phoneNumber: {
      type: String,
      default: '+880 1707697445',
    },
    address: {
      type: String,
      default: 'CDA Agrabad, Chattogram, Bangladesh',
    },
    currency: {
      type: String,
      default: 'BDT (৳)',
    },
    taxRate: {
      type: Number,
      default: 0, // ডিফল্ট ট্যাক্স ০%
    },
    shippingInside: {
      type: Number,
      default: 60, // চট্টগ্রামের ভেতরের শিপিং চার্জ
    },
    shippingOutside: {
      type: Number,
      default: 150, // চট্টগ্রামের বাইরের শিপিং চার্জ
    },
    enableBkash: {
      type: Boolean,
      default: true,
    },
    enableCard: {
      type: Boolean,
      default: true,
    },
    enableCOD: {
      type: Boolean,
      default: true,
    },
    facebook: {
      type: String,
      default: 'https://facebook.com',
    },
    instagram: {
      type: String,
      default: 'https://instagram.com',
    },
    twitter: {
      type: String,
      default: 'https://twitter.com',
    },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);