import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const location = useLocation();

  const [siteSettings, setSiteSettings] = useState<any>({
    storeName: 'MO FASHION',
    logoUrl: ''
  });

  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('mo_fashion_settings');
      if (savedSettings) {
        try {
          setSiteSettings(JSON.parse(savedSettings));
        } catch (e) {
          console.error("Error loading settings in footer", e);
        }
      }
    };

    loadSettings();

    window.addEventListener('storage', loadSettings);
    window.addEventListener('settingsUpdated', loadSettings);

    return () => {
      window.removeEventListener('storage', loadSettings);
      window.removeEventListener('settingsUpdated', loadSettings);
    };
  }, []);

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#111111] border-t border-[#D4AF37]/20 text-gray-300 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* 🚀 Brand Info (বড় ডায়নামিক লোগো সহ) */}
          <div>
            <Link to="/" onClick={scrollToTop} className="items-center space-x-3 mb-4 group inline-block">
              {siteSettings?.logoUrl && (
                <img 
                  src={siteSettings.logoUrl} 
                  alt="Logo" 
                  className="h-14 md:h-18 w-auto max-w-[220px] object-contain drop-shadow transition-transform group-hover:scale-105"
                />
              )}
              <h3 className="text-2xl font-serif font-bold text-[#D4AF37] tracking-widest">
                {siteSettings?.storeName || 'MO FASHION'}
              </h3>
            </Link>

            <p className="text-gray-400 mb-6 leading-relaxed">
              Premium E-Commerce Experience. Discover the latest trends in fashion and upgrade your style with our premium collection.
            </p>

            <div className="flex space-x-4">
              <a href={siteSettings?.facebook || "https://facebook.com"} target="_blank" rel="noopener noreferrer" className="bg-[#1A1A1A] border border-gray-800 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors font-bold text-sm shadow-md">
                FB
              </a>
              <a href={siteSettings?.instagram || "https://instagram.com"} target="_blank" rel="noopener noreferrer" className="bg-[#1A1A1A] border border-gray-800 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors font-bold text-sm shadow-md">
                IG
              </a>
              <a href={siteSettings?.twitter || "https://twitter.com"} target="_blank" rel="noopener noreferrer" className="bg-[#1A1A1A] border border-gray-800 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-colors font-bold text-sm shadow-md">
                X
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: 'Home', path: '/' },
                { name: 'Categories', path: '/categories' },
                { name: 'About Us', path: '/about' },
                { name: 'Cart', path: '/cart' },
              ].map((link) => {
                const active = isActivePath(link.path);
                return (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      onClick={scrollToTop} 
                      className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        active 
                        ? 'bg-[#D4AF37] text-black font-bold shadow-[0_0_12px_rgba(212,175,55,0.4)] border border-[#D4AF37]' 
                        : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">Customer Service</h4>
            <ul className="space-y-2">
              {[
                { name: 'FAQ', path: '/faq' },
                { name: 'Shipping & Returns', path: '/shipping' },
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms & Conditions', path: '/terms' },
              ].map((link) => {
                const active = isActivePath(link.path);
                return (
                  <li key={link.path}>
                    <Link 
                      to={link.path} 
                      onClick={scrollToTop} 
                      className={`inline-block px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                        active 
                        ? 'bg-[#D4AF37] text-black font-bold shadow-[0_0_12px_rgba(212,175,55,0.4)] border border-[#D4AF37]' 
                        : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wide">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="text-[#D4AF37] mt-1 shrink-0" size={20} />
                <span className="text-gray-400">{siteSettings?.address || 'CDA Agrabad, Chattogram, Bangladesh'}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="text-[#D4AF37] shrink-0" size={20} />
                <span className="text-gray-400">{siteSettings?.phoneNumber || '+880 1707697445'}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="text-[#D4AF37] shrink-0" size={20} />
                <span className="text-gray-400">{siteSettings?.contactEmail || 'kon497733@gmail.com'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#D4AF37]/20 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} {siteSettings?.storeName || 'MO FASHION'}. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <span className="text-gray-500 text-sm font-bold tracking-wider">VISA</span>
            <span className="text-gray-500 text-sm font-bold tracking-wider">MASTERCARD</span>
            <span className="text-gray-500 text-sm font-bold tracking-wider">BKASH</span>
          </div>
        </div>
        
      </div>
    </footer>
  );
}