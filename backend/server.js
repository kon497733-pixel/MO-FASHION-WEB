const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// রাউট ফাইলগুলো ইমপোর্ট করা
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

// অ্যাপ ইনিশিয়ালাইজ করা
const app = express();

// CORS পলিসি আপডেট (যাতে Vercel থেকে ডাটা পাঠাতে বাধা না দেয়)
app.use(cors());

// ডাটা লিমিট বাড়ানো (একাধিক বড় ছবি সেভ করার জন্য)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB ডাটাবেস কানেকশন সেটআপ
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
  })
  .catch((error) => {
    console.error('❌ MongoDB Connection Error:', error);
  });

// 🚀 ৩. কুপন কালেকশনের জন্য একটি সিম্পল API তৈরি করা হলো (সরাসরি server.js এ)
// এটি যেকোনো ডিভাইস থেকে কুপন ফেচ করতে সাহায্য করবে, ফায়ারবেসের কোনো রুল ব্লক করতে পারবে না।
const couponSchema = new mongoose.Schema({
  code: String,
  discount: String,
  discountValue: Number,
  discountType: String,
  expiry: String,
  status: String,
  usageLimit: Number,
  used: Number
}, { strict: false });

// মঙ্গোডিবি তে 'coupons' নামে কালেকশন তৈরি
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

// GET API: সব কুপন দেখার জন্য
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch coupons", error });
  }
});

// POST API: নতুন কুপন তৈরি বা আপডেট করার জন্য (অ্যাডমিন প্যানেল থেকে আসবে)
app.post('/api/coupons', async (req, res) => {
  try {
    const { code, discountValue, discountType, status, usageLimit, used, expiry } = req.body;
    
    // কোড দিয়ে খুঁজবে, থাকলে আপডেট করবে, না থাকলে নতুন তৈরি করবে
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (existingCoupon) {
      existingCoupon.used = used !== undefined ? used : existingCoupon.used;
      existingCoupon.status = status || existingCoupon.status;
      await existingCoupon.save();
      res.status(200).json({ message: "Coupon updated", coupon: existingCoupon });
    } else {
      const newCoupon = new Coupon(req.body);
      await newCoupon.save();
      res.status(201).json({ message: "Coupon created", coupon: newCoupon });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to save coupon", error });
  }
});


// API রাউটস (Products & Orders)
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// বেসিক রাউট
app.get('/', (req, res) => {
  res.send('MO FASHION Backend Server is Running Perfectly! 🎉');
});

// সার্ভার পোর্ট সেটআপ
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});