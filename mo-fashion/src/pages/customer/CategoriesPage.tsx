import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search, Folder } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 🚀 স্লাইডশো অটো-টাইমার স্টেট (প্রতি ২.৫ সেকেন্ডে পিকচার স্লাইড হবে)
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadCategoriesAndCounts = async () => {
      setLoading(true);

      // ১. প্রোডাক্টগুলোর লিস্ট আনা (কাউন্ট জানার জন্য)
      const savedProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');
      const categoryCounts: Record<string, number> = {};
      
      savedProducts.forEach((product: any) => {
        if (product.status !== 'Out of Stock') {
          const cat = product.category || 'Uncategorized';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      });

      // ২. ব্যাকএন্ড থেকে ফেচ করার চেষ্টা করা
      try {
        const response = await fetch('http://localhost:5000/api/categories');
        if (response.ok) {
          const apiCats = await response.json();
          if (Array.isArray(apiCats) && apiCats.length > 0) {
            const formatted = apiCats.map((cat: any) => ({
              ...cat,
              count: categoryCounts[cat.name] || 0,
              // 🚀 কোনো হার্ডকোডেড ডিফল্ট ছবি ছাড়াই শুধুমাত্র অ্যাডমিন প্যানেলের আপলোড করা ছবি
              imagesArray: (cat.images && cat.images.length > 0) 
                ? cat.images.filter((img: string) => img && img.trim() !== '')
                : (cat.image ? [cat.image] : [])
            }));
            setCategories(formatted);
            localStorage.setItem('mo_fashion_categories', JSON.stringify(formatted));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Backend API offline, using local storage categories.");
      }

      // ৩. লোকাল ডাটা ম্যাপ করা (অ্যাডমিনের আসল ছবি দিয়ে)
      const savedCategories = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
      const formattedLocal = savedCategories.map((cat: any) => ({
        ...cat,
        count: categoryCounts[cat.name] || 0,
        imagesArray: (cat.images && cat.images.length > 0) 
          ? cat.images.filter((img: string) => img && img.trim() !== '')
          : (cat.image ? [cat.image] : [])
      }));

      setCategories(formattedLocal);
      setLoading(false);
    };

    loadCategoriesAndCounts();
  }, []);

  // সার্চ ফিল্টার লজিক
  const filteredCategories = categories.filter(category => 
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen py-12 bg-[#111111] text-white">
      <Helmet>
        <title>Categories | {settings?.storeName || 'MO FASHION'}</title>
      </Helmet>

      <div className="container mx-auto px-4">
        
        {/* Page Header */}
        <div className="text-center mb-10 mt-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#D4AF37] mb-4 tracking-wider uppercase flex items-center justify-center">
            <Layers className="mr-4" size={40} />
            Our Collections
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
            Browse through our wide range of premium fashion categories.
          </p>

          {/* Search Bar for Categories */}
          <div className="max-w-xl mx-auto relative">
            <input 
              type="text" 
              placeholder="Search collections..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-full px-6 py-3 pl-12 text-white focus:outline-none focus:border-[#D4AF37] transition-colors shadow-lg"
            />
            <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-[#D4AF37] animate-pulse">Loading collections...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-gray-800 max-w-2xl mx-auto shadow-2xl">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-4">No Collections Available</h2>
            <p className="text-gray-400 mb-8">Please add categories and upload pictures from Category Management in Admin Panel.</p>
            <Link to="/" className="inline-block bg-[#D4AF37] text-black px-8 py-3 rounded-lg font-bold uppercase tracking-wider hover:bg-white transition-colors">
              Return to Home
            </Link>
          </div>
        ) : (
          /* Categories Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {filteredCategories.map((category, index) => {
              const hasImages = category.imagesArray && category.imagesArray.length > 0;

              return (
                <Link to={`/category/${encodeURIComponent(category.name)}`} key={index} className="group">
                  <div className="relative h-[400px] rounded-2xl overflow-hidden border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all duration-500 shadow-xl bg-[#1A1A1A]">
                    
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors duration-500 z-10"></div>
                    
                    {/* 🚀 100% Dynamic Image Slideshow (Admins custom photos only - No Fake Defaults) */}
                    {hasImages ? (
                      category.imagesArray.map((imgUrl: string, idx: number) => (
                        <img 
                          key={idx}
                          src={imgUrl} 
                          alt={category.name} 
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                            idx === (imageIndex % category.imagesArray.length) ? 'opacity-100 group-hover:scale-110 transition-transform duration-700' : 'opacity-0'
                          }`}
                        />
                      ))
                    ) : (
                      /* যদি এডমিন কোনো ছবি আপলোড না করে থাকে তবে এটি দেখাবে */
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-[#151515]">
                        <Folder size={64} className="mb-2 opacity-30 text-[#D4AF37]" />
                        <span className="text-xs uppercase font-bold tracking-widest text-gray-500">No Custom Image Uploaded</span>
                      </div>
                    )}
                    
                    {/* Category Content */}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                      <h2 className="text-3xl font-bold text-white mb-3 font-serif drop-shadow-2xl group-hover:text-[#D4AF37] transition-colors">
                        {category.name}
                      </h2>
                      
                      {/* Items Counter Badge */}
                      <span className="inline-block px-5 py-1.5 bg-black/70 backdrop-blur-md border border-[#D4AF37]/50 rounded-full text-[#D4AF37] text-sm font-bold tracking-wider mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-colors shadow-lg">
                        {category.count} {category.count === 1 ? 'Item' : 'Items'}
                      </span>
                      
                      <span className="flex items-center text-white opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 font-bold uppercase tracking-widest text-sm border-b border-white pb-1">
                        View Products <ArrowRight size={16} className="ml-2" />
                      </span>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
      </div>
    </main>
  );
}