import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

// 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  const [categories, setCategories] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 🚀 ছবিগুলো প্রতি ২ সেকেন্ডে পরিবর্তন করার জন্য টাইমার
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 ১. ক্লাউড থেকে প্রোডাক্ট এবং ক্যাটাগরি ডাটা প্রসেস করার ফাংশন
  const processAllData = (cloudCats: any[], cloudProds: any[]) => {
    return cloudCats.map((cat: any) => {
      const catNameLower = (cat.name || '').trim().toLowerCase();

      // রিয়েল-টাইম প্রোডাক্ট কাউন্ট (সরাসরি ক্লাউড ডাটা থেকে)
      const count = cloudProds.filter(
        (p: any) => p.category?.trim().toLowerCase() === catNameLower && p.status !== 'Out of Stock'
      ).length;

      let uploadedImages: string[] = [];
      if (Array.isArray(cat.images) && cat.images.length > 0) {
        uploadedImages = cat.images.filter((img: string) => img && typeof img === 'string' && img.trim() !== '');
      } else if (cat.imageUrl && typeof cat.imageUrl === 'string' && cat.imageUrl.trim() !== '') {
        uploadedImages = [cat.imageUrl];
      }

      return {
        ...cat,
        count,
        uploadedImages
      };
    });
  };

  // 🚀 ২. রিয়েল-টাইম ক্লাউড সিঙ্ক (সব ডিভাইসের জন্য)
  useEffect(() => {
    setLoading(true);

    // ফায়ারবেস থেকে প্রোডাক্ট লিসেনার
    const prodRef = collection(db, 'products');
    const unsubProds = onSnapshot(prodRef, (prodSnap) => {
      const cloudProds: any[] = [];
      prodSnap.forEach(doc => cloudProds.push({ id: doc.id, ...doc.data() }));
      setDbProducts(cloudProds);
      
      // ফায়ারবেস থেকে ক্যাটাগরি লিসেনার
      const catRef = collection(db, 'categories');
      const unsubCats = onSnapshot(catRef, (catSnap) => {
        const cloudCats: any[] = [];
        catSnap.forEach(doc => cloudCats.push({ id: doc.id, ...doc.data() }));

        const finalData = processAllData(cloudCats, cloudProds);
        setCategories(finalData);
        setLoading(false);
      });

      return () => unsubCats();
    });

    return () => unsubProds();
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
            Explore our premium fashion categories synced live from the cloud.
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
            <span className="text-xl font-bold uppercase tracking-widest">Connecting to Cloud...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-dashed border-gray-800 max-w-2xl mx-auto shadow-2xl">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-4">No Collections Found</h2>
            <p className="text-gray-400 mb-8">Please add categories from the Admin Panel to see them here live.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {filteredCategories.map((category, index) => (
              <Link to={`/category/${encodeURIComponent(category.name)}`} key={index} className="group">
                <div className="relative h-[400px] rounded-2xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-colors duration-500 shadow-lg bg-[#151515]">
                  
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors duration-500 z-10"></div>
                  
                  {/* 🚀 আপনার আপলোড করা আসল ছবিগুলো এখানে স্লাইড হবে */}
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
                    <div className="absolute inset-0 bg-[#1A1A1A] flex flex-col items-center justify-center text-gray-600">
                      <Layers size={48} className="mb-2 text-[#D4AF37]/30" />
                      <span className="text-xs uppercase tracking-widest text-gray-500 font-bold px-4 text-center">Please Upload Background from Admin Panel</span>
                    </div>
                  )}
                  
                  {/* Category Content */}
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