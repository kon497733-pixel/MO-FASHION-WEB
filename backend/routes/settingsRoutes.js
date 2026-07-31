const express = require('express');
const router = express.Router();

// আমাদের তৈরি করা কন্ট্রোলার থেকে ফাংশনগুলো ইমপোর্ট করা হলো
const {
  getSettings,
  updateSettings
} = require('../controllers/settingsController');

// রাউট বা লিংক সেটআপ করা হলো

// বেসিক রাউট: /api/settings
router.route('/')
  .get(getSettings)     // GET রিকোয়েস্টে যেকোনো ডিভাইস ক্লাউড ডাটাবেস থেকে সেটিংস পাবে
  .put(updateSettings); // PUT রিকোয়েস্টে অ্যাডমিন প্যানেল থেকে সেটিংস ক্লাউড ডাটাবেসে সেভ হবে

module.exports = router;