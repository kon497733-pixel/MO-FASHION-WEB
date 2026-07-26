import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

// 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

// 🚀 এইচডি ব্যাকগ্রাউন্ড কভার (যদি ক্যাটাগরিতে কোনো প্রোডাক্ট বা ছবি না থাকে)
const HD_DEFAULT_BACKGROUNDS: Record<string, string[]> = {
  "men": ["https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop"],
  "women": ["https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=800&auto=format&fit=crop"],
  "accessories": ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop"],
  "default": ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop"]
};

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  const [categories, setCategories] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // অটো-স্লাইড টাইমার
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 ডাটাবেস থেকে আসা প্রোডাক্ট এবং ক্যাটাগরি কানেক্ট করার লজিক
  useEffect(() => {
    setLoading(true);

    // ১. মঙ্গোডিবি (Render) থেকে প্রোডাক্ট আনা (ব্যাকগ্রাউন্ড ছবি ও কাউন্টিং এর জন্য)
    fetch('https://mo-fashion-api-mehedi.onrender.com/api/products')
      .then(res => res.json())
      .then(prods => {
        const prodArray = Array.isArray(prods) ? prods : [];
        setDbProducts(prodArray);
        localStorage.setItem('mo_fashion_products', JSON.stringify(prodArray));
      })
      .catch(() => {
        const savedProds = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');
        setDbProducts(savedProds);
      });

    // ২. ফায়ারবেস (Firebase) থেকে ক্যাটাগরি ডাটা সিঙ্ক
    const catRef = collection(db, 'categories');
    const unsubscribe = onSnapshot(catRef, (snapshot) => {
      const cloudCats: any[] = [];
      snapshot.forEach((docSnap) => {
        cloudCats.push({ id: docSnap.id, ...docSnap.data() });
      });

      // যদি ক্লাউডে ক্যাটাগরি না থাকে, তবে ডিফল্ট ক্যাটাগরি দেখাবে
      const activeCategories = cloudCats.length > 0 ? cloudCats : [
        { id: '1', name: "Men's Collection" },
        { id: '2', name: "Women's Collection" },
        { id: '3', name: "Accessories" }
      ];

      // 🚀 ম্যাজিক লজিক: ক্যাটাগরির ছবি না থাকলে প্রোডাক্টের ছবি ব্যাকগ্রাউন্ডে আনবে
      const finalProcessedCats = activeCategories.map(cat => {
        const catNameLower = (cat.name || '').trim().toLowerCase();

        // রিয়েল-টাইম প্রোডাক্ট কাউন্ট
        const categoryProducts = dbProducts.filter(
          (p: any) => p.category?.trim().toLowerCase() === catNameLower
        );
        const count = categoryProducts.filter((p: any) => p.status !== 'Out of Stock').length;

        let finalImages: string[] = [];

        // অপশন ১: অ্যাডমিন ప্যানেলের আপলোড করা ক্যাটাগরি ছবি
        if (Array.isArray(cat.images) && cat.images.length > 0) {
          finalImages = cat.images.filter((img: string) => img && img.trim() !== '');
        } else if (cat.imageUrl && cat.imageUrl.trim() !== '') {
          finalImages = [cat.imageUrl];
        } else if (cat.image && typeof cat.image === 'string' && cat.image.trim() !== '') {
          finalImages = [cat.image];
        }

        // 🚀 অপশন ২: ক্যাটাগরি ছবি না থাকলে ওই ক্যাটাগরির প্রোডাক্টগুলোর ছবি স্লাইডার হবে
        if (finalImages.length === 0 && categoryProducts.length > 0) {
          categoryProducts.forEach((p: any) => {
            if (p.images && p.images.length > 0) {
              p.images.forEach((img: string) => {
                if (img && !img.includes('placeholder') && !finalImages.includes(img)) {
                  finalImages.push(img);
                }
              });
            } else if (p.imageUrl && !finalImages.includes(p.imageUrl)) {
              finalImages.push(p.imageUrl);
            }
          });
        }

        // 🚀 অপশন ৩: প্রোডাক্টও না থাকলে এইচডি কভার পিকচার দেখাবে (কালো হবে না)
        if (finalImages.length === 0) {
          if (catNameLower.includes('men')) finalImages = HD_DEFAULT_BACKGROUNDS.men;
          else if (catNameLower.includes('women')) finalImages = HD_DEFAULT_BACKGROUNDS.women;
          else if (catNameLower.includes('access')) finalImages = HD_DEFAULT_BACKGROUNDS.accessories;
          else finalImages = HD_DEFAULT_BACKGROUNDS.default;
        }

        return {
          ...cat,
          count,
          finalImages
        };
      });

      setCategories(finalProcessedCats);
      setLoading(false);
    }, (error) => {
      console.error("Firebase Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dbProducts.length]); // প্রোডাক্ট লিস্ট চেঞ্জ হলে আবার ছবি আপডেট করবে

  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen py-12 bg-[#111111] text-white">
      <Helmet>
        <title>Categories | {safeSettings?.storeName || 'MO FASHION'}</title>
      </Helmet>

      <div className="container mx-auto px-4">
        
        <div className="text-center mb-10 mt-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#D4AF37] mb-4 tracking-wider uppercase flex items-center justify-center">
            <Layers className="mr-4" size={40} />
            Our Collections
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            View your custom categories and product background images live.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-16 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-full pl-14 pr-6 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors shadow-lg"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#D4AF37] animate-pulse flex flex-col items-center">
            <RefreshCw size={48} className="animate-spin mb-4" />
            <span className="text-xl font-bold uppercase tracking-widest">Synchronizing Live Images...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-24 bg-[#1A1A1A] rounded-3xl border border-dashed border-gray-800 max-w-3xl mx-auto">
            <h2 className="text-2xl font-serif font-bold text-white mb-2">No Categories Found</h2>
            <p className="text-gray-500">Please check your Admin Panel and ensure categories are saved.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {filteredCategories.map((category, index) => (
              <Link to={`/category/${encodeURIComponent(category.name)}`} key={index} className="group">
                <div className="relative h-[450px] rounded-3xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all duration-500 shadow-lg bg-black">
                  
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/20 transition-colors duration-500 z-10"></div>
                  
                  {/* 🚀 ১০০% ফিক্সড স্লাইডার: প্রোডাক্টের ছবি বা কাস্টম ছবিগুলো এখানে স্লাইড হবে */}
                  {category.finalImages && category.finalImages.length > 0 && category.finalImages.map((img: string, idx: number) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={category.name} 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                        idx === (imageIndex % category.finalImages.length) ? 'opacity-100 group-hover:scale-110 transition-transform duration-700' : 'opacity-0'
                      }`}
                    />
                  ))}
                  
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-3xl font-bold text-white mb-3 font-serif drop-shadow-2xl group-hover:text-[#D4AF37] transition-colors">
                      {category.name}
                    </h2>
                    
                    <span className="inline-block px-5 py-1.5 bg-black/60 backdrop-blur-md border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-sm font-bold tracking-wider mb-6">
                      {category.count} {category.count === 1 ? 'Item' : 'Items'}
                    </span>
                    
                    <span className="flex items-center text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 font-bold uppercase tracking-widest text-xs border-b border-white pb-1">
                      Explore Collection <ArrowRight size={16} className="ml-2" />
                    </span>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
        
      </div>
    </main>
  );
}