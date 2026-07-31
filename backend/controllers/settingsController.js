const Settings = require('../models/Settings');

// ১. গ্লোবাল সেটিংস ডাটাবেস থেকে নিয়ে আসার ফাংশন (Get Settings)
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({});
    
    // ডাটাবেসে আগে থেকে কোনো সেটিংস না থাকলে প্রথমবার অটোমেটিক তৈরি করবে
    if (!settings) {
      settings = await Settings.create({});
    }
    
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching settings', error: error.message });
  }
};

// ২. গ্লোবাল সেটিংস আপডেট/সেভ করার ফাংশন (Update/Save Settings)
const updateSettings = async (req, res) => {
  try {
    // ডাটাবেসে থাকলে আপডেট করবে, না থাকলে নতুন সেভ করবে (upsert: true)
    const updatedSettings = await Settings.findOneAndUpdate(
      {}, 
      req.body, 
      { new: true, upsert: true, runValidators: true }
    );
    
    res.status(200).json(updatedSettings);
  } catch (error) {
    res.status(400).json({ message: 'Error updating settings', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};