const mongoose = require('mongoose');

// ইউজার ও অ্যাডমিন ডাটা স্ট্রাকচার বা স্কিমা
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true, // একই ইমেইল দিয়ে দুটি অ্যাকাউন্ট খোলা যাবে না
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    profilePicture: {
      type: String,
      default: '', // ডেস্কটপ থেকে আপলোড করা ছবির URL বা ডাটা
    },
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer', // কাস্টমার নাকি অ্যাডমিন তা ট্র্যাক করার জন্য
    },
    isBlocked: {
      type: Boolean,
      default: false, // কাস্টমারকে ব্লক করা হলে এটি true হবে
    },
  },
  {
    timestamps: true, // অ্যাকাউন্ট খোলার তারিখ (Joined Date) সেভ রাখবে
  }
);

module.exports = mongoose.model('User', userSchema);