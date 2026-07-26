import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, ShoppingBag, Search } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

// 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

// ডিফল্ট ইমেজের লিংক (যদি অ্যাডমিন কোনো ছবি না দেয়)
const defaultImage = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop";

const categoryImages: Record<string, string> = {
  "Men's Collection": "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop",
  "Women's Collection": "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?q=80&w=600&auto=format&fit=crop",
  "Accessories": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop",
};

export default function CategoriesPage() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 🚀 ছবিগুলো প্রতি ২ সেকেন্ডে পরিবর্তন করার জন্য টাইমার স্টেট
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    // প্রতি ২ সেকেন্ড পর পর ব্যাকগ্রাউন্ড ছবি চেঞ্জ হবে
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 সরাসরি ক্লাউড ডাটাবেস থেকে রিয়েল-টাইম ক্যাটাগরি লোড
  useEffect(() => {
    setLoading(true);

    const savedProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');

    try {
      const colRef = collection(db, 'categories');
      
      // ফায়ারবেস ক্লাউড ডাটাবেস লিসেনার
      const unsubscribe = onSnapshot(colRef, (snapshot) => {
        const cloudCats: any[] = [];
        snapshot.forEach((docSnap) => {
          cloudCats.push({ id: docSnap.id, ...docSnap.data() });
        });

        let baseCategories = cloudCats.length > 0 
          ? cloudCats 
          : JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');

        if (baseCategories.length === 0) {
          baseCategories = [
            { id: 1, name: "Men's Collection" },
            { id: 2, name: "Women's Collection" },
            { id: 3, name: "Accessories" },
          ];
        }

        // প্রোডাক্ট কাউন্ট ও স্লাইডশো ইমেজ প্রসেসিং
        const enrichedCategories = baseCategories.map((cat: any) => {
          const count = savedProducts.filter((p: any) => p.category === cat.name && p.status !== 'Out of Stock').length;
          
          let imagesArray: string[] = [];
          if (Array.isArray(cat.images) && cat.images.length > 0) {
            imagesArray = cat.images.filter((url: string) => url && url.trim() !== '');
          } else if (cat.image && typeof cat.image === 'string' && cat.image.trim() !== '') {
            imagesArray = cat.image.split(/,|\s+/).map((url: string) => url.trim()).filter((url: string) => url.startsWith('http') || url.startsWith('data:image'));
          }

          if (imagesArray.length === 0) {
            if (categoryImages[cat.name]) {
              imagesArray.push(categoryImages[cat.name]);
            } else {
              imagesArray.push(defaultImage);
            }
          }

          return {
            ...cat,
            count,
            imagesArray
          };
        });

        setCategories(enrichedCategories);
        localStorage.setItem('mo_fashion_categories', JSON.stringify(enrichedCategories));
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Firestore Category Fetch Error:", e);
      setLoading(false);
    }
  }, []);

  // ক্যাটাগরি পেজের নিজস্ব লাইভ সার্চ ফিল্টার
  const filteredCategories = categories.filter(cat =>
    cat.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen py-12 bg-[#111111] text-white">
      <Helmet>
        <title>Categories | {safeSettings?.storeName || 'MO FASHION'}</title>
      </Helmet>

      <div className="container mx-auto px-4">
        
        {/* Page Header */}
        <div className="text-center mb-10 mt-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#D4AF37] mb-4 tracking-wider uppercase flex items-center justify-center">
            <Layers className="mr-4" size={40} />
            Our Collections
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Browse through our wide range of premium fashion categories curated specially for you.
          </p>
        </div>

        {/* Category Search Bar */}
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
          <div className="text-center py-20 text-[#D4AF37] animate-pulse font-medium">Loading collections...</div>
        ) : filteredCategories.length === 0 ? (
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
                  
                  {/* 🚀 ২ সেকেন্ডের ব্যাকগ্রাউন্ড অটো স্লাইডার */}
                  {category.imagesArray && category.imagesArray.map((img: string, idx: number) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={category.name} 
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                        idx === (imageIndex % category.imagesArray.length) ? 'opacity-100 group-hover:scale-110 transition-transform' : 'opacity-0'
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