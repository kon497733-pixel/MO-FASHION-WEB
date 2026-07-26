import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

// 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

// 🚀 এইচডি ব্যাকগ্রাউন্ড কভার (যাতে কোনো ডিভাইস কখনো ১ সেকেন্ডের জন্যও ফাঁকা বা কালো না হয়)
const HD_DEFAULT_BACKGROUNDS: Record<string, string[]> = {
  "men": ["https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop"],
  "women": ["https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=800&auto=format&fit=crop"],
  "accessories": ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop"],
  "default": ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop"]
};

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  // 🚀 লাইভ মঙ্গোডিবি এপিআই
  const API_URL = 'https://mo-fashion-api-mehedi.onrender.com/api/products';

  const [categories, setCategories] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🚀 ২ সেকেন্ডের ব্যাকগ্রাউন্ড অটো-স্লাইড টাইমার
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 প্রোডাক্ট লোড করা (ক্যাটাগরির ভেতরের ছবি নেওয়ার জন্য)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(API_URL);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setDbProducts(data);
            localStorage.setItem('mo_fashion_products', JSON.stringify(data));
          }
        }
      } catch (e) {
        const localP = localStorage.getItem('mo_fashion_products');
        if (localP) setDbProducts(JSON.parse(localP));
      }
    };
    fetchProducts();
  }, []);

  // 🚀 ১০০% বুলেটপ্রুফ ক্যাটাগরি পিকচার প্রসেসর (কখনো কোনো বক্স কালো বা ফাঁকা থাকবে না)
  const processCategoryData = (catList: any[], currentProducts: any[]) => {
    return catList.map((cat: any) => {
      const catNameLower = (cat.name || '').trim().toLowerCase();

      // প্রোডাক্ট সংখ্যা হিসাব
      const categoryProducts = currentProducts.filter(
        (p: any) => p.category?.trim().toLowerCase() === catNameLower && p.status !== 'Out of Stock'
      );

      let displayImages: string[] = [];

      // ১. যদি অ্যাডমিন কাস্টম ছবি আপলোড করে থাকে
      if (Array.isArray(cat.images) && cat.images.length > 0) {
        displayImages = cat.images.filter((img: string) => img && typeof img === 'string' && img.trim() !== '');
      } else if (cat.imageUrl && typeof cat.imageUrl === 'string' && cat.imageUrl.trim() !== '') {
        displayImages = [cat.imageUrl];
      } else if (cat.image && typeof cat.image === 'string' && cat.image.trim() !== '') {
        displayImages = [cat.image];
      }

      // ২. 🚀 যদি ক্যাটাগরিতে ছবি না দেওয়া থাকে, তবে ওই ক্যাটাগরির প্রোডাক্টগুলোর ছবি দিয়ে স্লাইডার বানাবে!
      if (displayImages.length === 0 && categoryProducts.length > 0) {
        categoryProducts.forEach((p: any) => {
          if (p.images && p.images.length > 0) {
            p.images.forEach((img: string) => {
              if (img && !img.includes('placeholder') && !displayImages.includes(img)) {
                displayImages.push(img);
              }
            });
          } else if (p.imageUrl && !displayImages.includes(p.imageUrl)) {
            displayImages.push(p.imageUrl);
          }
        });
      }

      // ৩. 🚀 যদি ক্যাটাগরিতে এবং প্রোডাক্টেও ছবি না থাকে, তবে এইচডি কভার পিকচার দেখাবে
      if (displayImages.length === 0) {
        if (catNameLower.includes('men') && !catNameLower.includes('women')) {
          displayImages = HD_DEFAULT_BACKGROUNDS.men;
        } else if (catNameLower.includes('women')) {
          displayImages = HD_DEFAULT_BACKGROUNDS.women;
        } else if (catNameLower.includes('access')) {
          displayImages = HD_DEFAULT_BACKGROUNDS.accessories;
        } else {
          displayImages = HD_DEFAULT_BACKGROUNDS.default;
        }
      }

      return {
        ...cat,
        count: categoryProducts.length,
        displayImages // ১০০% নিখুঁত ইমেজেস অ্যারে
      };
    });
  };

  // 🚀 রিয়েল-টাইম ফায়ারবেস ক্লাউড সিঙ্ক
  useEffect(() => {
    // ১. লোকাল মেমোরি থেকে সাথে সাথে ইনস্ট্যান্ট লোড
    const savedLocalCats = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
    if (savedLocalCats.length > 0) {
      setCategories(processCategoryData(savedLocalCats, dbProducts));
    } else {
      setCategories(processCategoryData([
        { id: '1', name: "Men's Collection" },
        { id: '2', name: "Women's Collection" },
        { id: '3', name: "Accessories" }
      ], dbProducts));
    }

    // ২. ক্লাউড ফায়ারবেস থেকে সিঙ্ক
    try {
      const colRef = collection(db, 'categories');
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const cloudCats: any[] = [];
        snapshot.forEach((docSnap) => {
          cloudCats.push({ id: docSnap.id, ...docSnap.data() });
        });

        const sourceArray = cloudCats.length > 0 ? cloudCats : savedLocalCats;
        if (sourceArray.length > 0) {
          const formatted = processCategoryData(sourceArray, dbProducts);
          setCategories(formatted);
          localStorage.setItem('mo_fashion_categories', JSON.stringify(sourceArray));
        }
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore Category Sync Error:", e);
    }
  }, [dbProducts]);

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
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500 z-10"></div>
                  
                  {/* 🚀 ১০০% গ্যারান্টেড ২ সেকেন্ডের অটো-স্লাইডার (যা কখনো কালো হবে না) */}
                  {category.displayImages && category.displayImages.map((img: string, idx: number) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={category.name} 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                        idx === (imageIndex % category.displayImages.length) ? 'opacity-100 group-hover:scale-110 transition-transform duration-700' : 'opacity-0'
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