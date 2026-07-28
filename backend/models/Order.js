const mongoose = require('mongoose');

// অর্ডার ডাটা স্ট্রাকচার বা স্কিমা
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true, // ইউনিক অর্ডার আইডি যেমন: #ORD-9876
    },
    customerInfo: {
      firstName: { type: String, required: [true, 'First name is required'] },
      lastName: { type: String, default: '' },
      email: { type: String, required: [true, 'Email address is required'] },
      phone: { type: String, required: [true, 'Phone number is required'] },
      address: { type: String, required: [true, 'Shipping address is required'] },
      city: { type: String, required: [true, 'City name is required'] },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'Bangladesh' },
    },
    orderItems: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 1 },
        size: { type: String, default: 'M' },
        color: { type: String, default: 'Black' },
        image: { type: String, default: '' },
      },
    ],
    paymentDetails: {
      method: { type: String, required: true }, // bKash, Credit/Debit Card, Cash on Delivery
      status: { type: String, default: 'Pending' }, // Pending, Paid, Failed
    },
    orderSummary: {
      subtotal: { type: Number, required: true },
      shipping: { type: Number, required: true }, // Chattogram বা Outside অনুযায়ী
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      couponCode: { type: String, default: '' },
      total: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true, // অর্ডার করার তারিখ ও সময় অটো সেভ হবে
  }
);

module.exports = mongoose.model('Order', orderSchema);