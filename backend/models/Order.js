const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // ১. কাস্টমারের তথ্য
  customerInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  
  // ২. কী কী প্রোডাক্ট অর্ডার করেছে তার লিস্ট
  orderItems: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: { type: String }
    }
  ],
  
  // ৩. পেমেন্টের তথ্য (বিকাশ, কার্ড নাকি ক্যাশ অন ডেলিভারি)
  paymentDetails: {
    method: { type: String, required: true }, 
    status: { type: String, default: 'Pending' } // Pending, Paid, Failed
  },
  
  // ৪. টাকার হিসাব
  orderSummary: {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  
  // ৫. অর্ডারের বর্তমান অবস্থা
  status: {
    type: String,
    default: 'Pending', // Pending, Processing, Shipped, Delivered, Cancelled
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);