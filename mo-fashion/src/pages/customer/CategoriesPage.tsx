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
  "men": ["data:image/jpeg;base64,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"],
  "women": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAnwMBIgACEQEDEQH/xAAcAAEAAgMBAQEAAAAAAAAAAAAAAQUEBgcDAgj/xAA8EAABAwMCBAQCBwYGAwAAAAABAAIDBAUREiEGEzFBByJRYTJxFBUjNoGxskJSc3SRoRZygpLB8DM0Yv/EABcBAQEBAQAAAAAAAAAAAAAAAAABAgP/xAAYEQEBAQEBAAAAAAAAAAAAAAAAAREhEv/aAAwDAQACEQMRAD8A7epREUREQEREBERAUKVCAiIgIiIClQiCURQEEoiICIiAiIgIiICIvKpqIqanknqJGxxRNLnvccBoG5JQemVi1dzt9EQ2srqWBx6CWZrPzKqoYa2/t59XJPRW1+8dLGTHNM3s6Rww5mf3Bg/vHcgWVJaLdRt00tDTRZ66IgCT6k9UHtSVtJWt1UdVBUN9YpA8f2Xuq6rsdsrDqnooeYOksY5cjfk9uHD8CsJ1RV2KRja+d1VbHu0irkA5lMT0EmPib0GvqO+d3IL5EByiApChSghSoUoCIiAiIgIiICIiAqW7NFwvFDbDvTsBq6hvZwaQI2n2Ljq/0K6VPSnPFdyyelFS49vPMgtwMLzqKiGnaHVEscTSQAXuDQT6bqv4puv1Lw7cLm0Bz6aBz2NPd3Ro/qQuOzeINJLEG0VtZ9Nlbpnud1xUOAx5tLAMfJowPZEdruFyo7axj62oZFzHaY2ndzz6NaN3H2CxYLtbbnI6hdzA+VjvsamnfFzW98B4Gob749Vy643Hibgu309XRWKKKF7WsdXV558uDuGFrHARDPRjfKOnVbXZeJmcWWC2VhibFcI7pFCWMOdLwcvLfYxaj8iUGycNveymnt8rnPkt8xp9bjkuZgOYSe50OaCfUFW5VTbtuIbuB0Ladx+elw/4Ct0VClQpQEREBERAREQEREBERAWsVlfJRcT1rKaAT1VTT0sUEbnaGl2ahxLnYOAACeh9ls61mqt/0/iSv5czoKiCmpJYJgAdDw6cbjuCCQR6Ht1RFXx8yrp+DbnUXq5QPYGDRTRUjND5MjQ08zXq8+PToufeGNFY73eo/rqWsmuzJRLTw4+xLGYdqOBtg7YJxu3A6r78YLteZ7vBarmIooKeISNbAXaJnHI17jPTbG+N9znK1/gquuNkvUF2oqGariAMUscbSTIxxALW43zkbY7tPocB17xVEcHCNycZYI5Z9DRkHU8BzTjruc9D29lW+Dlilhs0Vyqo9Eb3vlpmn9svAaZf9rQ1vtqP7S5pxDxXdrxD9W3KSSSihqnSMinZiZoBIDHO6kgEg53yv0Fw3eLberRBVWmVj6fQG6BsYyB8Lh2I9EVFB94rt/Dp/wAnq2VTQfeK7fw6f8nq2QEREEKURARFCCUREBERAREQFT0n3run8lS/qnVwqek+9d0/kqX9U6DQ/HaooW2u3Ur2NdXvmMkbsbsjAw78CS1ZfhpSMbT2CRzWkzUVTU+uHB8UbcfJhI/1O9VleInh9NxXX09fSXBlPNFDyXMljLmkAkgjB2O5VZwQ2vsdPDQXMBslnuBhLwSWvpp8jIPcCXHyx7Iis8QOCjX1V9u1rY76VS1IfNAMnnRuijcXNHqDq2HXfvhW3gXapKezVt1lJDK6QNib2LWZ834kn+nut3hdyeKKyN5GKmkjlYD0JY5zX/qYvnhBoFm1xN00stRNJStHQQukcWY9iDkexCD0oPvFdv4dP+T1bKpoPvFdv4dP+T1bIoiIEBERAUKUQEREBERARQpQeZkAOMFVFJIP8VXM4P8A6VL+qdWTviKqaX70XL+Tpf1TLOt+YuzK30K0bj6skayrFmAnrpKcUlRA+HXGWvd5QXZGH+Y4G5OrOMbrZLzXPo6ZjaZrZK2oeIqaN3Rzzvk//LQC4+zfXCqKCgYKmUNc6WC2B/2snWesc3L5D7hpwMbDU4dldSyNYpeIK3ibhN8NJO2Li22Qv+zc0E1LMYdpB6hzcfJwHsV0Dhi4Q13DlsqYGFjJKWMhmPg8oy38DkfgtJk4VpLpT0lM57qWqnoYqm310WdcUrY2skHyIEZx33PZZXhrLcbc64cN31rxW0sjqiF7nZE0Tzu4O7jVk+vmAO6akjaqCQDiG7HB/wDHT/k9WzZA44wVS0X3gu3+Sn/J6tovjCmrkx7oEQLTIiIgIiICIiAihEEqMhStD8Prjcb9Z6ipul7qBOytlhYGMhaNIIxto90RubviKpZhW0l9qquG3y1UU9NDGDFLG3BY6QnIc4fvhYHHtdd6W1zs4fqOVWU0DquWV0bXnls204IwC45OcdGO9l7/AOJDUcDO4ioKf6RJ9DM7YR3eBu049CDn5FZdNfBluxuU9e6xzveyHlUbDUQ4Zndxd5+rnADbs0e69LY+uobbFRmx1kjg08yTnQfaPdkvd8fdxJVBw9eblxHw3DW2e/xS3tmHzUckcYi67s041BuNw4O7Kwq71XReKFJaDV6bbJazM+EsaAZNTxq1Eah0G2eyI+uVdxYaClZZp/rCgZGYZefDo5jW438+dLhkHbOHFZlxNXcI2F1kr4amE6oaiKen1wu9sv3B7g7EdVhsvlbJ4mizsqWutv1YJ+UGtP2mojOrr0HTKreG+LqxvCdVcbrP9JqTdPoVPqY1u7nta0HSBsMknvgFBsnDrLm6orKq8UjKWeZsTMMkDg7TqBcME4zkbEnHqeqvovjWu8SRXmltk1bZrg+SrpmmQ08sTHRzgbluAAQcZxg/1VDduKLtc+D7Tf8AhQ6JHSOlqKctDzIyMP5kYyD3b1G5HTqkLyOjZCkLXaXiGG8cOUV2tkmls89M1wOCWapmNew++CR/cLYgtMoUqFKAiIgIiIChShQFo3hdZpKSxVLbpbuVUmvleznxDVpyMEey3hMINfpLXVVpq66asnpjWuI5HKjdpiHlaPM0ncZcR6uK1rgCkvPD1vv9ldb5pfoT3y2x8nlZUA5w0O6dQD2+JdF6LFjjqGFuS0+ck5efhx8v7IOXcUcOtu1DRXHhq01lr4ndK3mRwxmBsbj8Ze7GnY/tA7++VfVVoq5vFW31lTRGaibZ+VLOY8x83U/b57/3W5cmo0SDmZJIx5zvvv28uRtspdFUkuxK0NMWkAZ2d+9lBp8Vqmh8W/pkNE6O3/VIZzWR4j16zkZHfGFR2ng+4XTw9utrmjkoa83KSopTKNO4ILT7A7jPbqum8uo5WkTAP1E6sdu239FBhnLnnmdWYadR2OOuEFVZLrUVFsj+s7dVQXJjNM9PyshzxtlrvhLT1Bz33WNw5w+bBQWegY0HlTTySlm7Wl4e4j5AuwPkr+OKdskZc/U1oId5jv6fP8Vk4yg5u+wXLh3i4QWimknsN3qoaiVrNxRyslY8n2aQP+6QukqMKUBERAREQEREBCiICKFKAmERAwFGFKIIwpUKUDCIiAiIgIiICIiAiIgIiICIiAiIgIiIIUoiAiIgKERAUoiAiIg//9k="],
  "accessories": ["data:image/jpeg;base64,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"],
  "default": ["data:image/png;base64,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"]
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