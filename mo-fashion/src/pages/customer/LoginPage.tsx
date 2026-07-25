import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore'; 

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore(); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please enter both email and password.");
      return;
    }

    // ১. ডাটাবেস (Local Storage) থেকে সব ইউজারদের নিয়ে আসা
    const savedUsers = JSON.parse(localStorage.getItem('mo_fashion_users') || '[]');

    // ২. ইমেইল দিয়ে ইউজার খোঁজা
    const existingUser = savedUsers.find((user: any) => user.email === formData.email.toLowerCase().trim());

    if (!existingUser) {
      toast.error("No account found with this email! Please register first.");
      return;
    }

    // ৩. পাসওয়ার্ড চেক করা
    if (existingUser.password !== formData.password) {
      toast.error("Incorrect password! Please try again.");
      return;
    }

    // ৪. সফল লগিন হলে গ্লোবাল স্টোর এবং কারেন্ট ইউজার সেভ করা (প্রোফাইল পেজের জন্য) 🟢 UPDATED
    setUser(existingUser);
    localStorage.setItem('currentUser', JSON.stringify({
      id: existingUser.uid || existingUser._id || existingUser.email,
      name: existingUser.displayName || existingUser.name || '',
      email: existingUser.email
    }));

    toast.success("Welcome back! Logged in successfully.");
    
    // ৫. অ্যাডমিন হলে ড্যাশবোর্ডে, আর কাস্টমার হলে প্রোফাইল/হোমপেজে পাঠানো
    setTimeout(() => {
      if (existingUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile'); // সরাসরি প্রোফাইল পেজে যাবে
      }
    }, 1500);
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-[#111111] text-white">
      <Helmet>
        <title>Login | MO FASHION</title>
      </Helmet>

      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-2 tracking-wider uppercase">
            Welcome Back
          </h1>
          <p className="text-gray-400">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-gray-300 text-sm mb-2 font-medium">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-500" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-[#111111] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-300 text-sm mb-2 font-medium">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#111111] border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-[#D4AF37] transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" className="mr-2 accent-[#D4AF37]" />
              Remember me
            </label>
            <Link to="#" className="text-[#D4AF37] hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-black font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-white transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]"
          >
            Sign In
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-gray-400 mt-6 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#D4AF37] font-bold hover:text-white transition-colors">
            Sign up now
          </Link>
        </p>
      </div>
    </main>
  );
}