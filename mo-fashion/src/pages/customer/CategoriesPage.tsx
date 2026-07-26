import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

// 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ছবি পরিবর্তনের টাইমার
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 ডাটা প্রসেস করার ফাংশন (যাতে কোনো এরর না হয়)
  const processData = (cloudCats: any[]) => {
    const savedProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');

    return cloudCats.map((cat: any) => {
      const catNameLower = (cat.name || '').trim().toLowerCase();

      // প্রোডাক্ট কাউন্ট
      const count = savedProducts.filter(
        (p: any) => (p.category || '').trim().toLowerCase() === catNameLower && p.status !== 'Out of Stock'
      ).length;

      let imagesArray: string[] = [];
      if (Array.isArray(cat.images) && cat.images.length > 0) {
        imagesArray = cat.images.filter((img: string) => img && img.trim() !== '');
      } else if (cat.imageUrl) {
        imagesArray = [cat.imageUrl];
      }

      if (imagesArray.length === 0) {
        imagesArray = ["https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop"];
      }

      return { ...cat, count, imagesArray };
    });
  };

  // 🚀 সরাসরি ক্লাউড ডাটাবেস থেকে রিয়েল-টাইম ক্যাটাগরি লোড
  useEffect(() => {
    setLoading(true);

    try {
      const catRef = collection(db, 'categories');
      
      // রিয়েল-টাইম লিসেনার (যাতে অল ডিভাইসে সাথে সাথে আপডেট হয়)
      const unsubscribe = onSnapshot(catRef, (snapshot) => {
        const cloudCats: any[] = [];
        snapshot.forEach((docSnap) => {
          cloudCats.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (cloudCats.length > 0) {
          const finalData = processData(cloudCats);
          setCategories(finalData);
          localStorage.setItem('mo_fashion_categories', JSON.stringify(cloudCats));
        } else {
          // যদি ক্লাউড খালি থাকে তবে লোকাল চেক করবে
          const localCats = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
          setCategories(processData(localCats));
        }
        setLoading(false);
      }, (error) => {
        console.error("Firebase Error:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore Fetch Error:", e);
      setLoading(false);
    }
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
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Premium fashion categories synced live from the cloud database.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-16 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search collections..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-full pl-14 pr-6 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors shadow-lg"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#D4AF37] animate-pulse flex flex-col items-center">
            <RefreshCw size={48} className="animate-spin mb-4" />
            <span className="text-xl font-bold uppercase tracking-widest">Synchronizing Cloud...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-dashed border-gray-800 max-w-2xl mx-auto shadow-2xl">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-4">No Collections Found</h2>
            <p className="text-gray-400 mb-8">Please check if your Firebase Environment Variables are added to Vercel Settings.</p>
            <Link to="/" className="inline-block bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-white transition-colors">
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {filteredCategories.map((category, index) => (
              <Link to={`/category/${encodeURIComponent(category.name)}`} key={index} className="group">
                <div className="relative h-[400px] rounded-2xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors duration-500 shadow-lg bg-[#151515]">
                  
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors duration-500 z-10"></div>
                  
                  {/* 🚀 স্লাইডার */}
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
                  
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                    <h2 className="text-3xl font-bold text-white mb-3 font-serif drop-shadow-xl group-hover:text-[#D4AF37] transition-colors">
                      {category.name}
                    </h2>
                    
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