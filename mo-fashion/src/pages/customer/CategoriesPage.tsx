import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

// 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

// 🚀 হাই-ডেফিনিশন ফ্যাশন কভার পিকচারসমূহ (যাতে কোনো ডিভাইস কখনো খালি না থাকে)
const DEFAULT_CATEGORY_COVERS: Record<string, string> = {
  "men": "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop",
  "women": "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=800&auto=format&fit=crop",
  "accessories": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
  "fallback": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop"
};

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 🚀 ছবিগুলো প্রতি ২ সেকেন্ডে অটো-স্লাইড হওয়ার টাইমার
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 ১০০% বুলেটপ্রুফ ক্যাটাগরি ইমেজ প্রসেসর
  const processCategories = (catList: any[]) => {
    const savedProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');

    return catList.map((cat: any) => {
      // ক্যাটাগরির প্রোডাক্ট সংখ্যা হিসাব করা
      const count = savedProducts.filter(
        (p: any) => p.category?.trim().toLowerCase() === cat.name?.trim().toLowerCase() && p.status !== 'Out of Stock'
      ).length;

      let finalImages: string[] = [];

      // ১. অ্যাডমিন প্যানেল থেকে আপলোড করা ছবিগুলো চেক করা (images, imageUrl, image সব কি চেক করবে)
      if (Array.isArray(cat.images) && cat.images.length > 0) {
        finalImages = cat.images.filter((img: string) => img && typeof img === 'string' && img.trim() !== '');
      } else if (cat.imageUrl && typeof cat.imageUrl === 'string' && cat.imageUrl.trim() !== '') {
        finalImages = [cat.imageUrl];
      } else if (cat.image && typeof cat.image === 'string' && cat.image.trim() !== '') {
        finalImages = [cat.image];
      }

      // ২. যদি অ্যাডমিন ছবি আপলোড না করে থাকে, তবে নাম অনুযায়ী এইচডি ব্যাকগ্রাউন্ড কভার বসবে
      if (finalImages.length === 0) {
        const nameLower = (cat.name || '').toLowerCase();
        if (nameLower.includes('men')) {
          finalImages = [DEFAULT_CATEGORY_COVERS.men];
        } else if (nameLower.includes('women')) {
          finalImages = [DEFAULT_CATEGORY_COVERS.women];
        } else if (nameLower.includes('access')) {
          finalImages = [DEFAULT_CATEGORY_COVERS.accessories];
        } else {
          finalImages = [DEFAULT_CATEGORY_COVERS.fallback];
        }
      }

      return {
        ...cat,
        count,
        finalImages
      };
    });
  };

  // 🚀 রিয়েল-টাইম ফায়ারবেস ক্লাউড সিঙ্ক
  useEffect(() => {
    // ১. লোকাল মেমোরি থেকে সাথে সাথে ডাটা লোড
    const savedLocalCats = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
    if (savedLocalCats.length > 0) {
      setCategories(processCategories(savedLocalCats));
    } else {
      setCategories(processCategories([
        { id: '1', name: "Men's Collection" },
        { id: '2', name: "Women's Collection" },
        { id: '3', name: "Accessories" }
      ]));
    }

    // ২. ক্লাউড ফায়ারবেস থেকে লাইভ সিঙ্ক
    try {
      const colRef = collection(db, 'categories');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const cloudCats: any[] = [];
        snapshot.forEach((docSnap) => {
          cloudCats.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (cloudCats.length > 0) {
          const processed = processCategories(cloudCats);
          setCategories(processed);
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
                  <div className="absolute inset-0 bg-black/55 group-hover:bg-black/30 transition-colors duration-500 z-10"></div>
                  
                  {/* 🚀 ২ সেকেন্ডের ব্যাকগ্রাউন্ড অটো-স্লাইডার (যা কখনো ফাঁকা থাকবে না) */}
                  {category.finalImages && category.finalImages.map((img: string, idx: number) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={category.name} 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                        idx === (imageIndex % category.finalImages.length) ? 'opacity-100 group-hover:scale-110 transition-transform duration-700' : 'opacity-0'
                      }`}
                    />
                  ))}
                  
                  {/* Category Content */}
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-3xl font-bold text-white mb-3 font-serif drop-shadow-xl group-hover:text-[#D4AF37] transition-colors">
                      {category.name}
                    </h2>
                    
                    {/* Items Counter Badge */}
                    <span className="inline-block px-5 py-1.5 bg-black/60 backdrop-blur-md border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-sm font-bold tracking-wider mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors">
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