const mongoose = require('mongoose');

// কুপন ডাটা স্ট্রাকচার বা স্কিমা
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true, // একই কুপন কোড দুবার হবে না
      uppercase: true, // সব বড় হাতের অক্ষরে সেভ হবে
      trim: true,
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount cannot be negative'],
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    usageLimit: {
      type: Number,
      required: [true, 'Usage limit is required'],
      default: 100,
    },
    used: {
      type: Number,
      default: 0, // এ পর্যন্ত কুপনটি কতবার ব্যবহার করা হয়েছে
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Disabled', 'Expired'],
      default: 'Active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Coupon', couponSchema);