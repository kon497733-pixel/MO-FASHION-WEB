import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShoppingBag, Search, Tag, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import { useSettingsStore } from '../../store/useSettingsStore';
import { useCartStore } from '../../store/useCartStore';

export default function Home() {
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;
  const addToCart = useCartStore((state) => state.addToCart);

  // 🚀 আপনার লাইভ মঙ্গোডিবি ক্লাউড এপিআই লিঙ্ক
  const API_URL = 'https://mo-fashion-api-mehedi.onrender.com/api/products';

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 🚀 ছবিগুলো প্রতি ২ সেকেন্ডে অটো-স্লাইড হওয়ার জন্য স্টেট
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ১. সরাসরি লাইভ ক্লাউড ডাটাবেস থেকে সমস্ত প্রোডাক্ট ফেচ করা
  const fetchLiveProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const latestFirst = [...data].reverse();
          setAllProducts(latestFirst);
          setDisplayProducts(latestFirst);
          localStorage.setItem('mo_fashion_products', JSON.stringify(latestFirst));
        }
      }
    } catch (error) {
      console.error("Error fetching live products on Home:", error);
      const savedLocal = localStorage.getItem('mo_fashion_products');
      if (savedLocal) {
        try {
          const parsed = JSON.parse(savedLocal);
          setAllProducts(parsed);
          setDisplayProducts(parsed);
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  // সার্চ ফিল্টার লজিক
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setDisplayProducts(allProducts);
    } else {
      const filtered = allProducts.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setDisplayProducts(filtered);
    }
  }, [searchQuery, allProducts]);

  const handleAddToCart = (product: any) => {
    const originalPrice = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const sellingPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;

    const cartItem = {
      id: String(product._id || product.id),
      name: product.name,
      price: sellingPrice,
      quantity: 1,
      size: 'Standard',
      color: 'Default',
      imageUrl: product.imageUrl || (product.images && product.images[0]) || '',
      stock: Number(product.stock) || 0
    };

    addToCart(cartItem as any);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <main className="min-h-screen bg-[#111111] pb-12 text-white">
      <Helmet>
        <title>{safeSettings?.storeName || 'MO FASHION'} | Home</title>
      </Helmet>

      {/* Hero Section */}
      <section className="bg-[#1A1A1A] py-20 text-center border-b border-[#D4AF37]/20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 uppercase tracking-widest leading-tight">
            Welcome to <span className="text-[#D4AF37]">{safeSettings?.storeName || 'MO FASHION'}</span>
          </h1>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto text-lg md:text-xl font-light">
            {safeSettings?.tagline || 'Premium E-Commerce Experience'}
          </p>
          <Link to="/categories">
            <button className="bg-[#D4AF37] text-black px-10 py-4 rounded-lg hover:bg-white transition-all font-bold uppercase tracking-wider shadow-lg">
              Shop Now
            </button>
          </Link>
        </div>
      </section>

      {/* Search Bar */}
      <section className="pt-16 container mx-auto px-4">
        <div className="max-w-2xl mx-auto mb-10 relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Search premium products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-gray-800 rounded-full pl-14 pr-6 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors shadow-2xl"
          />
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-10 container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#D4AF37] tracking-wider mb-2 uppercase">
            NEW ARRIVALS
          </h2>
          
          {/* 🚀 মোট প্রোডাক্টের সংখ্যা কাউন্টার */}
          {!loading && displayProducts.length > 0 && (
            <p className="text-xs text-gray-400 font-medium tracking-widest uppercase mt-2">
              Showing <span className="text-[#D4AF37] font-bold">{displayProducts.length}</span> {displayProducts.length === 1 ? 'Product' : 'Products'} Available
            </p>
          )}

          <div className="w-24 h-1 bg-[#D4AF37] mx-auto opacity-50 rounded-full mt-4"></div>
        </div>

        {loading ? (
          <div className="text-center text-[#D4AF37] font-medium animate-pulse py-20 text-xl flex items-center justify-center gap-3">
            <RefreshCw size={24} className="animate-spin" />
            <span>Connecting to Live Cloud Database...</span>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-24 bg-[#1A1A1A] rounded-3xl border border-dashed border-gray-800 max-w-3xl mx-auto">
            <ShoppingBag size={64} className="mx-auto text-gray-700 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-2">No Products Available</h2>
            <p className="text-gray-500">
              {searchQuery ? `No product matches your search "${searchQuery}".` : "Products will appear here once added in the Admin Panel."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayProducts.map((product) => {
              const originalPrice = Number(product.price) || 0;
              const discount = Number(product.discount) || 0;
              const sellingPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;
              
              const productImages = (product.images && product.images.length > 0 && !product.images[0].includes('No+Image')) 
                ? product.images 
                : (product.imageUrl ? [product.imageUrl] : []);

              return (
                <div key={product._id || product.id} className="bg-[#1A1A1A] border border-[#D4AF37]/10 rounded-2xl p-4 text-center hover:border-[#D4AF37]/50 transition-all duration-500 group flex flex-col shadow-xl relative">
                  
                  {/* Product Image Box with 2-Sec Auto-Slider */}
                  <Link to={`/product/${product._id || product.id}`} className="block relative overflow-hidden rounded-xl mb-5 bg-[#111111] aspect-[4/5]">
                    {productImages.length > 0 ? (
                      productImages.map((img: string, idx: number) => (
                        <img 
                          key={idx}
                          src={img} 
                          alt={product.name} 
                          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                            idx === (imageIndex % productImages.length) ? 'opacity-100 group-hover:scale-110 transition-transform duration-700' : 'opacity-0'
                          }`} 
                        />
                      ))
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 uppercase text-xs tracking-widest">No Image</div>
                    )}

                    {/* 🚀 Daraz Style Discount Badge (Top Left) */}
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded shadow-lg z-10 flex items-center">
                        <Tag size={10} className="mr-1" /> -{discount}% OFF
                      </div>
                    )}

                    {/* 🚀 Stock Status Badges (Top Right) */}
                    {product.stock <= 0 || product.status === 'Out of Stock' ? (
                      <span className="absolute top-3 right-3 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm z-10 uppercase tracking-wider">
                        Sold Out
                      </span>
                    ) : product.stock <= 5 ? (
                      <span className="absolute top-3 right-3 bg-yellow-500/90 text-black text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm z-10 uppercase tracking-wider">
                        Few Left ({product.stock})
                      </span>
                    ) : (
                      <span className="absolute top-3 right-3 bg-green-600/80 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm z-10 uppercase tracking-wider">
                        In Stock
                      </span>
                    )}
                  </Link>
                  
                  <Link to={`/product/${product._id || product.id}`} className="mt-auto">
                    <h3 className="font-bold text-white mb-2 hover:text-[#D4AF37] transition-colors line-clamp-2 px-2 uppercase tracking-tighter text-sm">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="mb-5 flex items-center justify-center space-x-2">
                    <span className="text-[#D4AF37] font-bold text-xl">{safeSettings?.currency || '৳'} {sellingPrice.toFixed(2)}</span>
                    {discount > 0 && (
                      <span className="text-gray-500 line-through text-xs">{safeSettings?.currency || '৳'} {originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0 || product.status === 'Out of Stock'}
                    className="w-full flex items-center justify-center space-x-2 border border-[#D4AF37] text-[#D4AF37] py-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all font-bold uppercase tracking-widest text-xs disabled:opacity-30 shadow-md"
                  >
                    <ShoppingBag size={16} />
                    <span>{product.stock <= 0 || product.status === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}