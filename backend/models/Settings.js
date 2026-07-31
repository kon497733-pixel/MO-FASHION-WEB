const mongoose = require('mongoose');

// গ্লোবাল সেটিংসের ডাটাবেস নকশা (Schema)
const settingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'MO FASHION'
  },
  logoUrl: {
    type: String, // ওয়েবসাইট লোগোর লিংক বা কমপ্রেসড ছবি
    default: ''
  },
  aboutImageUrl: {
    type: String, // এবাউট পেজের টিমের ছবি
    default: ''
  },
  tagline: {
    type: String,
    default: 'Premium E-Commerce Experience'
  },
  contactEmail: {
    type: String,
    default: 'kon497733@gmail.com'
  },
  phoneNumber: {
    type: String,
    default: '+880 1707697445'
  },
  address: {
    type: String,
    default: 'CDA Agrabad, Chattogram, Bangladesh'
  },
  currency: {
    type: String,
    default: '৳'
  },
  taxRate: {
    type: Number,
    default: 0
  },
  shippingInside: {
    type: Number,
    default: 60
  },
  shippingOutside: {
    type: Number,
    default: 150
  },
  enableBkash: {
    type: Boolean,
    default: true
  },
  enableCard: {
    type: Boolean,
    default: true
  },
  enableCOD: {
    type: Boolean,
    default: true
  },
  facebook: {
    type: String,
    default: 'https://facebook.com'
  },
  instagram: {
    type: String,
    default: 'https://instagram.com'
  },
  twitter: {
    type: String,
    default: 'https://twitter.com'
  },
  faqs: [{
    question: { type: String },
    answer: { type: String }
  }]
}, {
  timestamps: true // সেভ করার সময় ধরে রাখবে
});

module.exports = mongoose.model('Settings', settingsSchema);