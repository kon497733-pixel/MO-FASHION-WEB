import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

import { db } from '../../firebase/config';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  const [categories, setCategories] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // অটো-স্লাইড টাইমার
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 ১০০% স্মার্ট ক্যাটাগরি প্রসেসর (ডাটাবেস ব্লক থাকলেও কাজ করবে)
  const processCategoryData = (catList: any[], prodsList: any[]) => {
    return catList.map((cat: any) => {
      const catNameLower = (cat.name || '').trim().toLowerCase();

      // প্রোডাক্ট কাউন্ট (Live or Local Data)
      const count = prodsList.filter(
        (p: any) => p.category?.trim().toLowerCase() === catNameLower && p.status !== 'Out of Stock'
      ).length;

      let uploadedImages: string[] = [];

      // শুধুমাত্র আপনার আপলোড করা ছবি নেবে
      if (Array.isArray(cat.images) && cat.images.length > 0) {
        uploadedImages = cat.images.filter((img: string) => img && typeof img === 'string' && img.trim() !== '');
      } else if (cat.imageUrl && typeof cat.imageUrl === 'string' && cat.imageUrl.trim() !== '') {
        uploadedImages = [cat.imageUrl];
      } else if (cat.image && typeof cat.image === 'string' && cat.image.trim() !== '') {
        uploadedImages = [cat.image];
      }

      return {
        ...cat,
        count,
        uploadedImages 
      };
    });
  };

  // 🚀 রিয়েল-টাইম এবং ব্যাকআপ ফেচার (যাতে "No Categories" না দেখায়)
  useEffect(() => {
    setLoading(true);

    const loadData = async () => {
      // ১. প্রোডাক্ট ফেচ (Render API থেকে)
      let currentProducts: any[] = [];
      try {
        const prodRes = await fetch('https://mo-fashion-api-mehedi.onrender.com/api/products');
        if (prodRes.ok) {
          currentProducts = await prodRes.json();
          setDbProducts(currentProducts);
        }
      } catch (e) {
        const localProds = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');
        currentProducts = localProds;
        setDbProducts(localProds);
      }

      // ২. ক্যাটাগরি ফেচ (Firebase Cloud থেকে)
      let currentCategories: any[] = [];
      try {
        const colRef = collection(db, 'categories');
        const snapshot = await getDocs(colRef); // onSnapshot এর বদলে getDocs ব্যবহার করা হলো সিকিউরিটি ইস্যু এড়াতে
        
        snapshot.forEach((docSnap) => {
          currentCategories.push({ id: docSnap.id, ...docSnap.data() });
        });

      } catch (e) {
        console.warn("Firestore blocked access, falling back to Local Storage...");
      }

      // ৩. যদি ক্লাউড থেকে ডাটা না আসে, তবে লোকাল ব্যাকআপ থেকে নেবে
      if (currentCategories.length === 0) {
        currentCategories = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
      }

      // ৪. যদি লোকাল মেমোরিও ফাঁকা থাকে, তবে ডিফল্ট ৩টি ক্যাটাগরি দেখাবে (কখনো ফাঁকা হবে না)
      if (currentCategories.length === 0) {
        currentCategories = [
          { id: '1', name: "Men's Collection" },
          { id: '2', name: "Women's Collection" },
          { id: '3', name: "Accessories" }
        ];
      }

      const formatted = processCategoryData(currentCategories, currentProducts);
      setCategories(formatted);
      setLoading(false);
    };

    loadData();
  }, []);

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
        </div>

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

        {loading ? (
          <div className="text-center py-20 text-[#D4AF37] animate-pulse">Loading Collections...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-dashed border-gray-800 max-w-2xl mx-auto shadow-2xl">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-4">No Collections Found</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {filteredCategories.map((category, index) => (
              <Link to={`/category/${encodeURIComponent(category.name)}`} key={index} className="group">
                <div className="relative h-[400px] rounded-2xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors duration-500 shadow-lg bg-[#151515]">
                  
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-500 z-10"></div>
                  
                  {category.uploadedImages && category.uploadedImages.length > 0 ? (
                    category.uploadedImages.map((img: string, idx: number) => (
                      <img 
                        key={idx}
                        src={img} 
                        alt={category.name} 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                          idx === (imageIndex % category.uploadedImages.length) ? 'opacity-100 group-hover:scale-110 transition-transform duration-700' : 'opacity-0'
                        }`}
                      />
                    ))
                  ) : (
                    <div className="absolute inset-0 bg-[#0A0A0A] flex items-center justify-center">
                       <span className="text-gray-700 uppercase tracking-widest text-[10px]">No Custom Image</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-3xl font-bold text-white mb-3 font-serif drop-shadow-xl group-hover:text-[#D4AF37] transition-colors">
                      {category.name}
                    </h2>
                    
                    <span className="inline-block px-5 py-1.5 bg-black/60 backdrop-blur-md border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-sm font-bold tracking-wider mb-6">
                      {category.count} {category.count === 1 ? 'Item' : 'Items'}
                    </span>
                    
                    <span className="flex items-center text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 font-bold uppercase tracking-widest text-xs border-b border-white pb-1">
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