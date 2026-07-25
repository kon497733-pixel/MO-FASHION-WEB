import { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';

// 🚀 রিয়েল-টাইম ফায়ারবেস ক্লাউড ইমপোর্ট
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

export default function MainLayout() {
  const [siteSettings, setSiteSettings] = useState<any>({
    storeName: 'MO FASHION',
    logoUrl: '',
    tagline: 'Premium E-Commerce Experience'
  });

  // রিয়েল-টাইম ক্লাউড থেকে লোগো ও সেটিংস আনা
  useEffect(() => {
    const savedSettings = localStorage.getItem('mo_fashion_settings');
    if (savedSettings) {
      try {
        setSiteSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }

    try {
      const docRef = doc(db, 'settings', 'store_settings');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setSiteSettings(docSnap.data());
        }
      });
      return () => unsubscribe();
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow pt-16 pb-16 md:pb-0 safe-padding-bottom">
        <Outlet />
      </main>

      {/* 🚀 Footer Section (ফুটারেও আসল লোগো যুক্ত করা হলো) */}
      <footer className="bg-secondary border-t border-primary/20 py-12 mt-auto text-center">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center">
          
          {/* Footer Logo & Name */}
          <Link to="/" className="flex items-center space-x-3 mb-3 group">
            {siteSettings?.logoUrl && siteSettings.logoUrl.trim() !== '' && (
              <img 
                src={siteSettings.logoUrl} 
                alt="Logo" 
                className="h-12 w-auto max-w-[160px] object-contain drop-shadow transition-transform group-hover:scale-105"
              />
            )}
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-primary tracking-widest">
              {siteSettings?.storeName || 'MO FASHION'}
            </h2>
          </Link>

          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            {siteSettings?.tagline || 'Premium E-Commerce Experience'}
          </p>

          <div className="w-24 h-px bg-primary/20 mb-6"></div>

          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} {siteSettings?.storeName || 'MO FASHION'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}