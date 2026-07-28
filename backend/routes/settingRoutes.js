const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');

// 🚀 1. গ্লোবাল সেটিংস ডাটাবেস থেকে নিয়ে আসার API (GET /api/settings)
router.get('/', async (req, res) => {
  try {
    let settings = await Setting.findOne({});
    
    // যদি ডাটাবেসে এখনো কোনো সেটিংস তৈরি না হয়ে থাকে, তবে ডিফল্ট সেটিংস অটো তৈরি করবে
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching store settings from database', error: error.message });
  }
});

// 🚀 2. গ্লোবাল সেটিংস আপডেট বা সেভ করার API (PUT /api/settings)
router.put('/', async (req, res) => {
  try {
    let settings = await Setting.findOne({});

    if (settings) {
      // যদি আগে থেকে সেটিংস ডাটাবেসে থাকে, তবে সেটি আপডেট করা
      settings = await Setting.findByIdAndUpdate(
        settings._id,
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      // না থাকলে নতুন সেটিং তৈরি করা
      settings = new Setting(req.body);
      await settings.save();
    }

    res.status(200).json({
      message: 'Store settings updated successfully across all devices worldwide!',
      settings,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating store settings', error: error.message });
  }
});

module.exports = router;