const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// 🚀 তৈরি করা ৬টি API রাউট ইমপোর্ট করা হলো
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const couponRoutes = require('./routes/couponRoutes');
const settingRoutes = require('./routes/settingRoutes');

// এক্সপ্রেস অ্যাপ ইনিশিয়ালাইজ করা
const app = express();

// মিডলওয়্যার সেটআপ (প্রোফাইল পিকচার ও ছবি আপলোডের সুবিধার জন্য ১০MB সাইজ লিমিট)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 🚀 MongoDB Cloud Database কানেকশন
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI is not defined in .env file!');
} else {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log('--------------------------------------------------');
      console.log('🚀 MO FASHION Cloud Database Connected Successfully! 🎉');
      console.log('--------------------------------------------------');
    })
    .catch((err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
    });
}

// 🚀 API Endpoints রেজিস্টার করা হলো
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingRoutes);

// বেসিক টেস্ট রাউট (সার্ভার চেক করার জন্য)
app.get('/', (req, res) => {
  res.send('MO FASHION Live Backend API Server Engine is Running... 🚀');
});

// ভুল ইউআরএল হ্যান্ডলার (404 Error)
app.use((req, res) => {
  res.status(404).json({ message: 'API Endpoint Not Found!' });
});

// সার্ভার পোর্ট সেটআপ ও স্টার্ট
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`📡 MO FASHION Server is running on: http://localhost:${PORT}`);
});