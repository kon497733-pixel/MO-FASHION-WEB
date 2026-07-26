import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShoppingBag, Image as ImageIcon, ArrowRight, Search, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

// 🚀 ফায়ারবেস ক্লাউড কানেকশন ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCartStore } from '../../store/useCartStore';

export default function Home() {
  const { settings } = useSettingsStore();
  const addToCart = useCartStore((state) => state.addToCart);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [displayProducts, setDisplayProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 🚀 ১. ফায়ারবেস ক্লাউড থেকে রিয়েল-টাইম ডাটা লোড (মুহূর্তের মধ্যে সব ডিভাইসে দেখাবে)
  useEffect(() => {
    // প্রথমে লোকাল মেমোরি থেকে দ্রুত লোড করার চেষ্টা (যদি থাকে)
    const saved = localStorage.getItem('mo_fashion_products');
    if (saved) {
      const localData = JSON.parse(saved);
      setAllProducts(localData);
      setDisplayProducts(localData);
      setLoading(false);
    }

    // এবার ক্লাউড ডাটাবেসের সাথে সরাসরি কানেক্ট হওয়া (Real-time listener)
    const q = query(collection(db, 'products'), orderBy('updatedAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const prodsArray = querySnapshot.docs.map(docData => ({
        id: docData.id,
        ...docData.data()
      }));
      
      setAllProducts(prodsArray);
      setDisplayProducts(prodsArray);
      setLoading(false);
      // লোকাল মেমোরি আপডেট করে রাখা পরবর্তী দ্রুত লোডের জন্য
      localStorage.setItem('mo_fashion_products', JSON.stringify(prodsArray));
    }, (error) => {
      console.error("Cloud fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ২. লাইভ সার্চ লজিক
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
      id: product.id,
      name: product.name,
      price: sellingPrice,
      quantity: 1,
      size: 'Standard',
      color: 'Default',
      imageUrl: product.imageUrl || (product.images && product.images[0]) || '',
      stock: Number(product.stock) || 0
    };

    addToCart(cartItem);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <main className="min-h-screen bg-[#111111] pb-12 text-white">
      <Helmet>
        <title>{settings?.storeName || 'MO FASHION'} | Home</title>
      </Helmet>

      {/* Hero Section */}
      <section className="bg-[#1A1A1A] py-20 text-center border-b border-[#D4AF37]/20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 uppercase tracking-widest leading-tight">
            Welcome to <span className="text-[#D4AF37]">{settings?.storeName || 'MO FASHION'}</span>
          </h1>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto text-lg md:text-xl font-light">
            {settings?.tagline || 'Premium E-Commerce Experience'}
          </p>
          <Link to="/categories">
            <button className="bg-[#D4AF37] text-black px-10 py-4 rounded-lg hover:bg-white transition-all font-bold uppercase tracking-wider shadow-lg">
              Shop Now
            </button>
          </Link>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#D4AF37] tracking-wider mb-4 uppercase">
            NEW ARRIVALS
          </h2>
          <div className="w-24 h-1 bg-[#D4AF37] mx-auto opacity-50 rounded-full"></div>
        </div>

        {/* 🚀 স্মার্ট সার্চ বার */}
        <div className="max-w-2xl mx-auto mb-16 relative group">
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

        {loading ? (
          <div className="text-center text-[#D4AF37] font-medium animate-pulse py-20 text-xl">Loading live database...</div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-24 bg-[#1A1A1A] rounded-3xl border border-dashed border-gray-800 max-w-3xl mx-auto">
            <ShoppingBag size={64} className="mx-auto text-gray-700 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-2">No Products Available</h2>
            <p className="text-gray-500">The collection is currently empty or loading from cloud.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayProducts.map((product) => {
              const originalPrice = Number(product.price) || 0;
              const discount = Number(product.discount) || 0;
              const sellingPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;
              const displayImg = product.imageUrl || (product.images && product.images[0]);

              return (
                <div key={product.id} className="bg-[#1A1A1A] border border-[#D4AF37]/10 rounded-2xl p-4 text-center hover:border-[#D4AF37]/50 transition-all duration-500 group flex flex-col shadow-xl relative">
                  
                  <Link to={`/product/${product.id}`} className="block relative overflow-hidden rounded-xl mb-5 bg-[#111111] aspect-[4/5]">
                    {displayImg ? (
                      <img src={displayImg} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 uppercase text-xs tracking-widest">No Image</div>
                    )}

                    {discount > 0 && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded shadow-lg z-10 flex items-center">
                        <Tag size={10} className="mr-1" /> -{discount}% OFF
                      </div>
                    )}
                  </Link>
                  
                  <Link to={`/product/${product.id}`} className="mt-auto">
                    <h3 className="font-bold text-white mb-2 hover:text-[#D4AF37] transition-colors line-clamp-2 px-2 uppercase tracking-tighter text-sm">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="mb-5 flex items-center justify-center space-x-2">
                    <span className="text-[#D4AF37] font-bold text-xl">{settings?.currency || '৳'} {sellingPrice.toFixed(2)}</span>
                    {discount > 0 && (
                      <span className="text-gray-500 line-through text-xs">{settings?.currency || '৳'} {originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="w-full flex items-center justify-center space-x-2 border border-[#D4AF37] text-[#D4AF37] py-3 rounded-xl hover:bg-[#D4AF37] hover:text-black transition-all font-bold uppercase tracking-widest text-xs disabled:opacity-30 shadow-md"
                  >
                    <ShoppingBag size={16} />
                    <span>{product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
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