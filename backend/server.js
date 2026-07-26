const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// রাউট ফাইলগুলো ইমপোর্ট করা
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// 🚀 ১. CORS পলিসি আপডেট (যাতে Vercel থেকে ডাটা পাঠাতে বাধা না দেয়)
app.use(cors());

// 🚀 ২. ডাটা লিমিট বাড়ানো (একাধিক বড় ছবি সেভ করার জন্য এটি খুবই জরুরি)
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

// API রাউটস যুক্ত করা
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