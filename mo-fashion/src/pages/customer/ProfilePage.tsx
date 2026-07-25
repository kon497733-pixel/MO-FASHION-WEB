import React, { useState, useEffect, useRef } from 'react';
import { 
  FiEdit2, 
  FiCamera, 
  FiMail, 
  FiMapPin, 
  FiCalendar, 
  FiCheck, 
  FiX, 
  FiLogOut,
  FiUser,
  FiLogIn,
  FiUserPlus
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

// প্রোফাইল ডাটা টাইপ
interface UserProfile {
  name: string;
  role: string;
  email: string;
  bio: string;
  location: string;
  joinedDate: string;
  avatarUrl: string;
  coverUrl: string;
}

// কারেন্ট লগইন ইউজার টাইপ
interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ১. কারেন্ট লগইন ইউজার চেক করা (আপনার সিস্টেমে যেখানে লগইন ইউজার সেভ থাকে)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);

  // ২. নতুন ইউজারের জন্য একদম খালি (Blank) প্রোফাইল টেমপ্লেট
  const getEmptyProfile = (user: AuthUser | null): UserProfile => ({
    name: user?.name || '',
    role: 'Customer',
    email: user?.email || '',
    bio: '',
    location: '',
    joinedDate: new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' }),
    avatarUrl: '', // খালি
    coverUrl: ''   // খালি
  });

  // ৩. প্রোফাইল লোড (নির্দিষ্ট ইউজারের ID/Email অনুযায়ী)
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (!currentUser) return getEmptyProfile(null);

    // প্রতিটি ইউজারের জন্য আলাদা Key
    const userStorageKey = `user_profile_${currentUser.email || currentUser.id || 'guest'}`;
    const savedData = localStorage.getItem(userStorageKey);

    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error("Error parsing profile data", e);
      }
    }
    // নতুন ইউজার হলে ফাঁকা প্রোফাইল ফেরত দেবে
    return getEmptyProfile(currentUser);
  });

  const [formData, setFormData] = useState<UserProfile>(profile);

  // ইউজার পরিবর্তন হলে ডাটা আপডেট
  useEffect(() => {
    if (currentUser) {
      const userStorageKey = `user_profile_${currentUser.email || currentUser.id || 'guest'}`;
      const savedData = localStorage.getItem(userStorageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setProfile(parsed);
        setFormData(parsed);
      } else {
        const empty = getEmptyProfile(currentUser);
        setProfile(empty);
        setFormData(empty);
      }
    }
  }, [currentUser]);

  // ইনপুট হ্যান্ডলার
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ডাটা সেভ হ্যান্ডলার (নির্দিষ্ট ইউজারের কি-তে সেভ হবে)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setProfile(formData);
    const userStorageKey = `user_profile_${currentUser.email || currentUser.id || 'guest'}`;
    localStorage.setItem(userStorageKey, JSON.stringify(formData));
    setIsEditing(false);
    alert('প্রোফাইল তথ্য সফলভাবে সেভ হয়েছে!');
  };

  const handleCancel = () => {
    setFormData(profile);
    setIsEditing(false);
  };

  // ফাইল আপলোড হ্যান্ডলার (কম্পিউটার থেকে ছবি আপডেট)
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    imageType: 'avatarUrl' | 'coverUrl'
  ) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ফাইল সাইজ অত্যন্ত বড়! সর্বোচ্চ 5MB ছবি দিন।');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        const updatedProfile = { ...profile, [imageType]: base64Image };
        
        setProfile(updatedProfile);
        setFormData(updatedProfile);

        const userStorageKey = `user_profile_${currentUser.email || currentUser.id || 'guest'}`;
        localStorage.setItem(userStorageKey, JSON.stringify(updatedProfile));
      };
      reader.readAsDataURL(file);
    }
  };

  // ৪. লগআউট হ্যান্ডলার (সব ডাটা মুছে ফেলা এবং লগইন/সাইনআপ বাটন দেখানো)
  const handleLogout = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে লগআউট করতে চান?')) {
      // লগইন সেশন মুছে ফেলা
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      localStorage.removeItem('token');

      // স্টেট খালি করে দেওয়া
      setCurrentUser(null);
      setProfile(getEmptyProfile(null));
      setFormData(getEmptyProfile(null));
      setIsEditing(false);

      alert('আপনি সফলভাবে লগআউট হয়েছেন।');
    }
  };

  // =========================================================
  // অবস্থা ১: ইউজার লগইন না থাকলে এই স্ক্রিনটি দেখাবে
  // =========================================================
  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
            <FiUser className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              আপনার প্রোফাইলে প্রবেশ করুন
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              প্রোফাইল দেখতে, নতুন তথ্য যোগ করতে বা অর্ডার ট্র্যাক করতে অনুগ্রহ করে লগইন করুন অথবা একাউন্ট তৈরি করুন।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl shadow transition"
            >
              <FiLogIn className="w-4 h-4" /> লগইন
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-2.5 px-4 rounded-xl transition"
            >
              <FiUserPlus className="w-4 h-4" /> সাইন আপ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // অবস্থা ২: ইউজার লগইন থাকলে মূল প্রোফাইল দেখাবে
  // =========================================================
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      
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

      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden relative">
        
        {/* কভার ফটো সেকশন (খালি থাকলে ব্যাকগ্রাউন্ড কালার থাকবে) */}
        <div className="relative h-48 sm:h-64 bg-gray-300 dark:bg-gray-700">
          {profile.coverUrl ? (
            <img 
              src={profile.coverUrl} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span>কভার ফটো যোগ করুন</span>
            </div>
          )}

          <button 
            onClick={() => coverInputRef.current?.click()}
            title="কভার ছবি পরিবর্তন করুন"
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full shadow-md transition"
          >
            <FiCamera className="w-5 h-5" />
          </button>
        </div>

        {/* প্রোফাইল হেডার */}
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 mb-6 gap-4">
            
            {/* প্রোফাইল ছবি (খালি থাকলে ডিফল্ট আইকন দেখাবে) */}
            <div className="relative group">
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name} 
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 object-cover shadow-lg bg-white"
                />
              ) : (
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-800 shadow-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                  <FiUser className="w-16 h-16" />
                </div>
              )}

              <button 
                onClick={() => avatarInputRef.current?.click()}
                title="প্রোফাইল ছবি পরিবর্তন করুন"
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-md transition"
              >
                <FiCamera className="w-4 h-4" />
              </button>
            </div>

            {/* বাটনসমূহ */}
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow transition font-medium text-sm sm:text-base"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    প্রোফাইল এডিট
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800 transition font-medium text-sm sm:text-base"
                  >
                    <FiLogOut className="w-4 h-4" />
                    লগআউট
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleSave}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow transition"
                  >
                    <FiCheck className="w-4 h-4" /> সেভ
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                  >
                    <FiX className="w-4 h-4" /> বাতিল
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* তথ্য / এডিট ফর্ম */}
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.name || 'আপনার নাম প্রদান করুন'}
                </h1>
                <p className="text-blue-600 dark:text-blue-400 font-medium">
                  {profile.role}
                </p>
              </div>

              <p className="text-gray-600 dark:text-gray-300 max-w-2xl italic">
                {profile.bio || 'এখনো কোনো বায়ো দেওয়া হয়নি। এডিট বাটনে ক্লিক করে যোগ করুন।'}
              </p>

              <div className="flex flex-wrap gap-4 pt-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <FiMail className="w-4 h-4" />
                  <span>{profile.email || 'ইমেইল দেওয়া হয়নি'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiMapPin className="w-4 h-4" />
                  <span>{profile.location || 'ঠিকানা দেওয়া হয়নি'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FiCalendar className="w-4 h-4" />
                  <span>যুক্ত হয়েছেন: {profile.joinedDate}</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">নাম</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">পদবী / টাইটেল</label>
                  <input 
                    type="text" 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ইমেইল</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  placeholder="আপনার ইমেইল"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">বায়ো (Bio)</label>
                <textarea 
                  name="bio" 
                  rows={3}
                  value={formData.bio} 
                  onChange={handleChange}
                  placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ঠিকানা</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange}
                  placeholder="যেমন: ঢাকা, বাংলাদেশ"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
          )}

          {/* অর্ডার বা স্ট্যাটাস সেকশন */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 text-center">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <span className="block text-xl font-bold text-gray-900 dark:text-white">০০</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">মোট অর্ডার</span>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <span className="block text-xl font-bold text-gray-900 dark:text-white">০০</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">পেন্ডিং অর্ডার</span>
            </div>
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <span className="block text-xl font-bold text-gray-900 dark:text-white">০০</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">উইশলিস্ট</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;