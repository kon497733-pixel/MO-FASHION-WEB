const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 🚀 1. নতুন অ্যাকাউন্ট রেজিস্ট্রেশন করার API (POST /api/users/register)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    // ইমেইল আগে থেকেই ডাটাবেসে আছে কি না চেক করা
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists!' });
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      address: address || '',
      role: role || 'customer',
    });

    const savedUser = await newUser.save();
    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        _id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        address: savedUser.address,
        profilePicture: savedUser.profilePicture,
        role: savedUser.role,
        isBlocked: savedUser.isBlocked,
      },
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating account', error: error.message });
  }
});

// 🚀 2. কাস্টমার ও অ্যাডমিন লগইন করার API (POST /api/users/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ইমেইল চেক করা
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password!' });
    }

    // অ্যাকাউন্ট ব্লকড কি না চেক করা
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by the admin!' });
    }

    // পাসওয়ার্ড ভ্যালিডেশন
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password!' });
    }

    res.status(200).json({
      message: 'Login successful!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profilePicture: user.profilePicture,
        role: user.role,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// 🚀 3. সব কাস্টমারের লিস্ট ডাটাবেস থেকে আনার API (GET /api/users) - অ্যাডমিনের জন্য
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// 🚀 4. নির্দিষ্ট ইউজারের প্রোফাইল ডাটা আনার API (GET /api/users/:id)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// 🚀 5. প্রোফাইল ও প্রোফাইল পিকচার সেভ/আপডেট করার API (PUT /api/users/:id)
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found to update' });
    }

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error updating profile', error: error.message });
  }
});

// 🚀 6. কাস্টমারকে ব্লক বা আনব্লক করার API (PUT /api/users/:id/block)
router.put('/:id/block', async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: `User status changed to ${isBlocked ? 'Blocked' : 'Active'}`,
      user: updatedUser,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error changing user status', error: error.message });
  }
});

// 🚀 7. কাস্টমার একাউন্ট ডাটাবেস থেকে ডিলিট করার API (DELETE /api/users/:id)
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found to delete' });
    }
    res.status(200).json({ message: 'User deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
});

module.exports = router;