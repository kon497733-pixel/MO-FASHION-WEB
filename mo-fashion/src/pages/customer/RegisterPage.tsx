import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore'; 

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore(); 
  
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    const savedUsers = JSON.parse(localStorage.getItem('mo_fashion_users') || '[]');

    const existingUser = savedUsers.find((user: any) => user.email === formData.email.toLowerCase());
    if (existingUser) {
      toast.error("An account with this email already exists!");
      return;
    }

    const userRole: 'admin' | 'customer' = formData.email.toLowerCase() === 'admin@mofashion.com' ? 'admin' : 'customer';

    const newUser = {
      uid: `USER-${Math.floor(1000 + Math.random() * 9000)}`,
      email: formData.email.toLowerCase(),
      password: formData.password, 
      displayName: formData.name,
      photoURL: null,
      role: userRole,
      phone: '',
      address: '',
      memberSince: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    };

    savedUsers.push(newUser);
    localStorage.setItem('mo_fashion_users', JSON.stringify(savedUsers));

    // গ্লোবাল স্টোর এবং কারেন্ট ইউজার সেভ করা (প্রোফাইল পেজের জন্য) 🟢 UPDATED
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify({
      id: newUser.uid,
      name: newUser.displayName,
      email: newUser.email
    }));

    toast.success("Account created successfully!");
    
    setTimeout(() => {
      if (newUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile'); // সরাসরি প্রোফাইল পেজে যাবে
      }
    }, 1500);
  };

  return (
    <main className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-[#111111] text-white">
      <Helmet>
        <title>Create Account | MO FASHION</title>
      </Helmet>

      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-2 tracking-wider uppercase">
            Create Account
          </h1>
          <p className="text-gray-400">Join MO FASHION for a premium experience</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-300 text-sm mb-2 font-medium">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-500" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-[#111111] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                placeholder="e.g. Mehedi Hasan"
                required
              />
            </div>
          </div>

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
                placeholder="e.g. mail@example.com"
                required
              />
            </div>
          </div>

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
                placeholder="Create a password"
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

          <div>
            <label className="block text-gray-300 text-sm mb-2 font-medium">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-[#111111] border border-gray-700 rounded-lg pl-10 pr-12 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <div className="flex items-start text-sm">
            <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" className="mr-2 accent-[#D4AF37] mt-1" required />
              <span>I agree to the <Link to="#" className="text-[#D4AF37] hover:underline">Terms & Conditions</Link> and <Link to="#" className="text-[#D4AF37] hover:underline">Privacy Policy</Link></span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-black font-bold uppercase tracking-wider py-3 rounded-lg hover:bg-white transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)] mt-2"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{' '}
          <Link to="/register" className="text-[#D4AF37] font-bold hover:text-white transition-colors">
            Sign in now
          </Link>
        </p>
      </div>
    </main>
  );
}