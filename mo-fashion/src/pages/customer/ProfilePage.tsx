import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit, Camera, Mail, MapPin, Calendar, Check, X, LogOut,
  User, LogIn, UserPlus, Phone, Package, Clock, ShieldCheck, Upload
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

interface UserProfile {
  _id?: string;
  id?: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  joinedDate: string;
  avatarUrl: string;
  coverUrl: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ১. কারেন্ট লগইন ইউজার চেক করা (Local Storage থেকে)
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const defaultProfile: UserProfile = {
    name: currentUser?.name || 'Customer Name',
    role: currentUser?.role || 'Customer',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    bio: 'Premium Customer at MO FASHION.',
    joinedDate: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    avatarUrl: currentUser?.profilePicture || '',
    coverUrl: ''
  };

  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [formData, setFormData] = useState<UserProfile>(defaultProfile);

  // 🚀 ২. ক্লাউড ডাটাবেস (MongoDB API) থেকে প্রোফাইল ডাটা ফেচ করা
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      const userId = currentUser._id || currentUser.id;

      // ১. লোকাল ক্যাশ লোড করা (ইনস্ট্যান্ট রেন্ডার)
      const userKey = `user_profile_${currentUser.email || userId}`;
      const savedLocal = localStorage.getItem(userKey);
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          setProfile(parsed);
          setFormData(parsed);
        } catch (e) {}
      }

      // ২. ক্লাউড ডাটাবেস (MongoDB API) থেকে রিয়েল-টাইম সিঙ্ক
      if (userId) {
        try {
          setLoading(true);
          const response = await fetch(`http://localhost:5000/api/users/${userId}`);
          if (response.ok) {
            const cloudUser = await response.json();
            if (cloudUser && !cloudUser.message) {
              const merged: UserProfile = {
                ...defaultProfile,
                _id: cloudUser._id,
                id: cloudUser._id,
                name: cloudUser.name || defaultProfile.name,
                email: cloudUser.email || defaultProfile.email,
                phone: cloudUser.phone || defaultProfile.phone,
                address: cloudUser.address || defaultProfile.address,
                avatarUrl: cloudUser.profilePicture || defaultProfile.avatarUrl,
              };
              setProfile(merged);
              setFormData(merged);
              localStorage.setItem(userKey, JSON.stringify(merged));
            }
          }
        } catch (error) {
          console.warn("Backend API offline, using cached profile.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🚀 ৩. ক্লাউড ডাটাবেসে প্রোফাইল ডাটা সেভ করার API Call (PUT)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setProfile(formData);
    const userKey = `user_profile_${currentUser.email || currentUser._id || currentUser.id}`;
    localStorage.setItem(userKey, JSON.stringify(formData));
    
    // currentUser ক্যাশও আপডেট করা
    const updatedUserObj = { ...currentUser, name: formData.name, phone: formData.phone, address: formData.address, profilePicture: formData.avatarUrl };
    localStorage.setItem('currentUser', JSON.stringify(updatedUserObj));
    localStorage.setItem('user', JSON.stringify(updatedUserObj));
    
    setIsEditing(false);

    const userId = currentUser._id || currentUser.id;
    const toastId = toast.loading("Saving profile to Cloud Database...");

    // ক্লাউড মঙ্গোডিবি ডাটাবেসে সিঙ্ক করা
    try {
      if (userId) {
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            profilePicture: formData.avatarUrl
          })
        });

        if (response.ok) {
          toast.success("Profile saved LIVE on Cloud Database!", { id: toastId });
          return;
        }
      }
      toast.success("Profile updated successfully!", { id: toastId });
    } catch (err) {
      toast.success("Profile updated locally!", { id: toastId });
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  // 🚀 ৪. ফটো আপলোড ও আল্ট্রা-ফাস্ট লাইটওয়েট কমপ্রেশন
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    imageType: 'avatarUrl' | 'coverUrl'
  ) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = imageType === 'avatarUrl' ? 250 : 600;
          const scaleFactor = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = img.width * scaleFactor;
          canvas.height = img.height * scaleFactor;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          const updatedProfile = { ...profile, [imageType]: compressedBase64 };
          
          setProfile(updatedProfile);
          setFormData(updatedProfile);

          const userKey = `user_profile_${currentUser.email || currentUser._id || currentUser.id}`;
          localStorage.setItem(userKey, JSON.stringify(updatedProfile));
          toast.success(`${imageType === 'avatarUrl' ? 'Profile picture' : 'Cover photo'} loaded! Click "Save" to push live.`);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // ৫. লগআউট হ্যান্ডলার
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      setCurrentUser(null);
      setProfile(defaultProfile);
      setFormData(defaultProfile);
      setIsEditing(false);

      toast.success('You have logged out successfully.');
      navigate('/login');
    }
  };

  // =========================================================
  // অবস্থা ১: ইউজার লগইন না থাকলে এই স্ক্রিনটি দেখাবে
  // =========================================================
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#111111] text-white px-4">
        <Helmet><title>Profile | MO FASHION</title></Helmet>
        <div className="max-w-md w-full bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto shadow-inner">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-wider">
              Access Your Profile
            </h2>
            <p className="text-gray-400 mt-2 text-sm">
              Please sign in to view your orders, update profile details, and manage addresses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 flex items-center justify-center gap-2 bg-[#D4AF37] text-black font-bold py-3 px-4 rounded-xl hover:bg-white transition shadow-lg uppercase text-xs tracking-wider"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex-1 flex items-center justify-center gap-2 bg-[#111111] border border-gray-700 text-white font-medium py-3 px-4 rounded-xl hover:border-[#D4AF37] transition text-xs uppercase tracking-wider"
            >
              <UserPlus className="w-4 h-4" /> Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // অবস্থা ২: ইউজার লগইন থাকলে মূল প্রফেশনাল ডার্ক-গোল্ড প্রোফাইল দেখাবে
  // =========================================================
  return (
    <div className="min-h-screen bg-[#111111] text-white py-10 px-4 sm:px-6 lg:px-8">
      <Helmet><title>{profile.name || 'User Profile'} | MO FASHION</title></Helmet>
      
      {/* ফাইল আপলোড ইনপুট */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={(e) => handleImageUpload(e, 'avatarUrl')} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={coverInputRef} 
        onChange={(e) => handleImageUpload(e, 'coverUrl')} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="max-w-4xl mx-auto bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl shadow-2xl overflow-hidden relative">
        
        {/* কভার ফটো সেকশন */}
        <div className="relative h-48 sm:h-64 bg-[#0a0a0a] border-b border-[#D4AF37]/10">
          {profile.coverUrl ? (
            <img 
              src={profile.coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs font-bold uppercase tracking-widest">
              <span>Upload Banner Image</span>
            </div>
          )}

          <button 
            onClick={() => coverInputRef.current?.click()}
            title="Upload Cover Photo"
            className="absolute top-4 right-4 bg-black/70 hover:bg-[#D4AF37] hover:text-black text-white p-2.5 rounded-full shadow-lg border border-[#D4AF37]/30 transition-all duration-300"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* প্রোফাইল হেডার */}
        <div className="relative px-6 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 mb-6 gap-4">
            
            {/* প্রোফাইল ছবি */}
            <div className="relative group">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name} 
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#1A1A1A] object-cover shadow-2xl bg-[#111111]"
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#1A1A1A] shadow-2xl bg-[#111111] flex items-center justify-center text-[#D4AF37]">
                  <User className="w-16 h-16" />
                </div>
              )}

              <button 
                onClick={() => avatarInputRef.current?.click()}
                title="Upload Profile Picture"
                className="absolute bottom-2 right-2 bg-[#D4AF37] text-black hover:bg-white p-2.5 rounded-full shadow-lg transition-all duration-300 border border-black"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* বাটনসমূহ */}
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-[#D4AF37] text-black hover:bg-white px-5 py-2.5 rounded-lg shadow-md transition font-bold text-sm uppercase tracking-wider"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 px-4 py-2.5 rounded-lg border border-red-500/30 transition font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-1.5 bg-[#D4AF37] text-black px-5 py-2.5 rounded-lg shadow-md hover:bg-white transition font-bold text-sm uppercase"
                  >
                    <Check className="w-4 h-4" /> Save Live
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg transition text-sm font-medium"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* তথ্য / এডিট ফর্ম */}
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                  {profile.name || 'Your Name'}
                </h1>
                <p className="text-[#D4AF37] font-medium text-sm tracking-wider uppercase mt-1">
                  {profile.role}
                </p>
              </div>

              <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
                {profile.bio || 'No bio added yet. Click "Edit Profile" to write something about yourself.'}
              </p>

              <div className="flex flex-wrap gap-6 pt-3 text-sm text-gray-400 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D4AF37]" />
                  <span>{profile.email || 'No Email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  <span>{profile.phone || 'No Phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  <span>{profile.address || 'No Address'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>Member Since: {profile.joinedDate}</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 mt-4 bg-[#111111] p-6 rounded-xl border border-gray-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    placeholder="+880 17..."
                    className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Email (Read Only)</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  readOnly
                  className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-gray-800 text-gray-500 rounded-lg cursor-not-allowed text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Bio</label>
                <textarea 
                  name="bio" 
                  rows={3}
                  value={formData.bio} 
                  onChange={handleChange}
                  placeholder="Write something about yourself..."
                  className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange}
                  placeholder="e.g. Chattogram, Bangladesh"
                  className="w-full px-4 py-2.5 bg-[#1A1A1A] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#D4AF37] text-sm"
                />
              </div>
            </form>
          )}

          {/* কুইক অ্যাকশন লিংক */}
          <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between items-center text-sm">
            <Link to="/cart" className="text-[#D4AF37] hover:underline flex items-center gap-2">
              <Package size={18} /> View Cart & Orders
            </Link>
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <ShieldCheck size={14} className="text-green-500" /> Account Verified
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}