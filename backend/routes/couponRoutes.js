const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');

// 🚀 1. সব কুপনের লিস্ট নিয়ে আসার API (GET /api/coupons) - অ্যাডমিনের জন্য
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons from database', error: error.message });
  }
});

// 🚀 2. কাস্টমারের কার্ট পেজে কুপন ভ্যালিডেট করার রিয়েল-টাইম API (POST /api/coupons/validate)
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or non-existent coupon code!' });
    }

    if (coupon.status !== 'Active') {
      return res.status(400).json({ message: 'This coupon is currently disabled!' });
    }

    // মেয়াদের তারিখ চেক করা
    if (new Date(coupon.expiryDate) < new Date()) {
      coupon.status = 'Expired';
      await coupon.save();
      return res.status(400).json({ message: 'This coupon code has expired!' });
    }

    // ইউসেজ লিমিট চেক করা
    if (coupon.used >= coupon.usageLimit) {
      return res.status(400).json({ message: 'This coupon has reached its maximum usage limit!' });
    }

    res.status(200).json({
      message: 'Coupon applied successfully!',
      coupon: {
        code: coupon.code,
        discountValue: coupon.discountValue,
        type: coupon.type,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error validating coupon', error: error.message });
  }
});

// 🚀 3. নতুন কুপন ডাটাবেসে তৈরি করার API (POST /api/coupons)
router.post('/', async (req, res) => {
  try {
    const { code } = req.body;
    const upperCode = code.toUpperCase();

    // একই কুপন কোড দুইবার আছে কি না চেক
    const couponExists = await Coupon.findOne({ code: upperCode });
    if (couponExists) {
      return res.status(400).json({ message: `Coupon code "${upperCode}" already exists!` });
    }

    const newCoupon = new Coupon({
      ...req.body,
      code: upperCode,
    });

    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    res.status(400).json({ message: 'Error creating coupon', error: error.message });
  }
});

// 🚀 4. কুপনের তথ্য বা লিমিট এডিট করার API (PUT /api/coupons/:id)
router.put('/:id', async (req, res) => {
  try {
    if (req.body.code) {
      req.body.code = req.body.code.toUpperCase();
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ message: 'Coupon not found to update' });
    }

    res.status(200).json(updatedCoupon);
  } catch (error) {
    res.status(400).json({ message: 'Error updating coupon', error: error.message });
  }
});

// 🚀 5. কুপন ডাটাবেস থেকে মুছে ফেলার API (DELETE /api/coupons/:id)
router.delete('/:id', async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon) {
      return res.status(404).json({ message: 'Coupon not found to delete' });
    }
    res.status(200).json({ message: 'Coupon deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
});

module.exports = router;