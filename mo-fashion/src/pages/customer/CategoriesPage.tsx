import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

// 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 🚀 ছবিগুলো প্রতি ২ সেকেন্ডে পরিবর্তন করার জন্য টাইমার
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 ক্যাটাগরি ও ক্লাউড ইমেজেস প্রসেস করার ফাংশন
  const formatCategoryData = (catList: any[]) => {
    const savedProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');

    return catList.map((cat: any) => {
      // ওই ক্যাটাগরির কতটি প্রোডাক্ট আছে হিসাব করা
      const count = savedProducts.filter(
        (p: any) => p.category?.trim().toLowerCase() === cat.name?.trim().toLowerCase() && p.status !== 'Out of Stock'
      ).length;

      // 🚀 অ্যাডমিন প্যানেল থেকে আসা আসল ক্লাউড ছবিগুলো ধরা হচ্ছে
      let imagesArray: string[] = [];

      if (Array.isArray(cat.images) && cat.images.length > 0) {
        imagesArray = cat.images.filter((url: string) => url && url.trim() !== '');
      } else if (cat.imageUrl && cat.imageUrl.trim() !== '') {
        imagesArray = [cat.imageUrl];
      }

      // যদি একদম কোনো ছবিই না দেওয়া থাকে, তবে সুন্দর একটি ডিফল্ট কভার দেখাবে
      if (imagesArray.length === 0) {
        imagesArray = ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop"];
      }

      return {
        ...cat,
        count,
        imagesArray
      };
    });
  };

  // 🚀 সরাসরি ক্লাউড ডাটাবেস থেকে রিয়েল-টাইম লাইভ সিঙ্ক
  useEffect(() => {
    // ১. লোকাল মেমোরি চেক (ইনস্ট্যান্ট লোডের জন্য)
    const savedLocalCats = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
    if (savedLocalCats.length > 0) {
      setCategories(formatCategoryData(savedLocalCats));
    }

    // ২. ফায়ারবেস ক্লাউড ডাটাবেস থেকে লাইভ লাইভ আপডেট
    try {
      const colRef = collection(db, 'categories');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const cloudCats: any[] = [];
        snapshot.forEach((docSnap) => {
          cloudCats.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (cloudCats.length > 0) {
          const formatted = formatCategoryData(cloudCats);
          setCategories(formatted);
          localStorage.setItem('mo_fashion_categories', JSON.stringify(cloudCats));
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore Category Sync Error:", e);
    }
  }, []);

  // সার্চ ফিল্টার
  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen py-12 bg-[#111111] text-white">
      <Helmet>
        <title>Categories | {safeSettings?.storeName || 'MO FASHION'}</title>
      </Helmet>

      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-10 mt-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#D4AF37] mb-4 tracking-wider uppercase flex items-center justify-center">
            <Layers className="mr-4" size={40} />
            Our Collections
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Browse through our wide range of premium fashion categories curated specially for you.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-16 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search categories... (e.g., Men, Winter)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-full pl-14 pr-6 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors shadow-lg"
          />
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-dashed border-gray-800 max-w-2xl mx-auto shadow-2xl">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-4">No Collections Found</h2>
            <p className="text-gray-400 mb-8">
              {searchQuery ? `We couldn't find any category matching "${searchQuery}".` : "Currently, there are no categories available."}
            </p>
            <Link to="/" className="inline-block bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-white transition-colors">
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {filteredCategories.map((category, index) => (
              <Link to={`/category/${encodeURIComponent(category.name)}`} key={index} className="group">
                <div className="relative h-[400px] rounded-2xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors duration-500 shadow-lg bg-[#151515]">
                  
                  {/* Background Overlay */}
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors duration-500 z-10"></div>
                  
                  {/* 🚀 ২ সেকেন্ডের অটোমেটিক স্লাইডার (অ্যাডমিনের আসল ছবি দিয়ে) */}
                  {category.imagesArray && category.imagesArray.map((img: string, idx: number) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={category.name} 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                        idx === (imageIndex % category.imagesArray.length) ? 'opacity-100 group-hover:scale-110 transition-transform duration-700' : 'opacity-0'
                      }`}
                    />
                  ))}
                  
                  {/* Category Content */}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-3xl font-bold text-white mb-3 font-serif drop-shadow-xl group-hover:text-[#D4AF37] transition-colors">
                      {category.name}
                    </h2>
                    
                    {/* Items Counter Badge */}
                    <span className="inline-block px-5 py-1.5 bg-black/50 backdrop-blur-md border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-sm font-bold tracking-wider mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
                      {category.count} {category.count === 1 ? 'Item' : 'Items'}
                    </span>
                    
                    <span className="flex items-center text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 font-bold uppercase tracking-widest text-sm border-b border-white pb-1">
                      View Products <ArrowRight size={16} className="ml-2" />
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