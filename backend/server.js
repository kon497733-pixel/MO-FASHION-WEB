const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// রাউট ফাইলগুলো ইমপোর্ট করা
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes'); // নতুন অর্ডারের রাউট ইমপোর্ট করা হলো

// অ্যাপ ইনিশিয়ালাইজ করা
const app = express();

// মিডলওয়্যার (Middleware) - ফ্রন্টএন্ডের সাথে ডাটা আদান-প্রদানের জন্য
app.use(cors());
app.use(express.json());

// MongoDB ডাটাবেস কানেকশন সেটআপ
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
  })
  .catch((error) => {
    console.error('❌ MongoDB Connection Error:', error);
  });

// API রাউটস (Routes) যুক্ত করা
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes); // নতুন অর্ডারের API লিংক যুক্ত করা হলো

// বেসিক রাউট (সার্ভার ঠিকমতো কাজ করছে কি না তা চেক করার জন্য)
app.get('/', (req, res) => {
  res.send('MO FASHION Backend Server is Running Perfectly! 🎉');
});

// সার্ভার পোর্ট সেটআপ
const PORT = process.env.PORT || 5000;

// সার্ভার চালু করা
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});