import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, ShoppingBag, Search, Tag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCartStore } from '../../store/useCartStore';

export default function CategoryProductsPage() {
  const { id } = useParams(); 
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;
  const addToCart = useCartStore((state) => state.addToCart);

  // 🚀 আপনার রেন্ডারের অরিজিনাল লাইভ ক্লাউড ডাটাবেস API লিঙ্ক
  const API_URL = 'https://mo-fashion-api-mehedi.onrender.com/api/products';
  
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 🚀 ছবিগুলো প্রতি ২ সেকেন্ডে পরিবর্তন করার জন্য টাইমার
  const [imageIndex, setImageIndex] = useState(0);

  // URL থেকে ক্যাটাগরির আসল নাম নেওয়া
  const categoryTitle = id ? decodeURIComponent(id) : "Exclusive Collection";

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 🚀 ১. সরাসরি লাইভ ক্লাউড ডাটাবেস (Render MongoDB) থেকে ক্যাটাগরির প্রোডাক্ট লোড করা
  useEffect(() => {
    const fetchLiveCategoryProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_URL);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // ক্যাটাগরির নাম ম্যাচ করানোর লজিক
            const targetCat = categoryTitle.trim().toLowerCase();
            const filtered = data.filter((product: any) => {
              const pCat = (product.category || '').trim().toLowerCase();
              return pCat === targetCat || pCat.includes(targetCat) || targetCat.includes(pCat);
            });

            setCategoryProducts(filtered.reverse());
            localStorage.setItem('mo_fashion_products', JSON.stringify(data));
          }
        }
      } catch (err) {
        console.error("Error fetching category products:", err);
        // লোকাল মেমোরি ফলব্যাক
        const savedProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');
        const targetCat = categoryTitle.trim().toLowerCase();
        const filtered = savedProducts.filter((product: any) => {
          const pCat = (product.category || '').trim().toLowerCase();
          return pCat === targetCat || pCat.includes(targetCat) || targetCat.includes(pCat);
        });
        setCategoryProducts(filtered.reverse());
      } finally {
        setLoading(false);
      }
    };

    fetchLiveCategoryProducts();
  }, [categoryTitle]);

  // রিয়েল-টাইম Add to Cart
  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (product.stock <= 0 || product.status === 'Out of Stock') {
      toast.error('This product is currently out of stock!');
      return;
    }

    const origPrice = Number(product.price) || 0;
    const discPercent = Number(product.discount) || 0;
    const sellingPrice = discPercent > 0 ? origPrice - (origPrice * discPercent / 100) : origPrice;

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

  const displayedProducts = categoryProducts.filter(product => 
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen py-12 bg-[#111111] text-white border-t border-[#D4AF37]/10">
      <Helmet>
        <title>{categoryTitle} | {safeSettings?.storeName || 'MO FASHION'}</title>
      </Helmet>

      <div className="container mx-auto px-4">
        
        {/* Back Button */}
        <Link to="/categories" className="inline-flex items-center text-gray-400 hover:text-[#D4AF37] transition-colors mb-8 font-medium">
          <ChevronLeft size={20} className="mr-1" />
          <span>Back to Categories</span>
        </Link>

        {/* Page Header & Search */}
        <div className="text-center mb-12 border-b border-[#D4AF37]/10 pb-10">
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#D4AF37] mb-4 tracking-wider uppercase">
            {categoryTitle}
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg mb-8">
            Explore our premium products available in {categoryTitle}.
          </p>

          {categoryProducts.length > 0 && (
            <div className="max-w-xl mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" size={20} />
              </div>
              <input 
                type="text" 
                placeholder={`Search in ${categoryTitle}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-gray-800 rounded-full pl-12 pr-6 py-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center text-[#D4AF37] py-20 text-xl font-serif animate-pulse">Loading live collection from cloud...</div>
        ) : categoryProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-dashed border-gray-800 max-w-2xl mx-auto shadow-2xl">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-4">No Products Found</h2>
            <p className="text-gray-400 mb-8">We currently don't have any products available in the "{categoryTitle}" category.</p>
            <Link to="/categories" className="inline-block bg-[#D4AF37] text-black px-8 py-3 rounded-lg hover:bg-white transition-colors font-bold tracking-wide uppercase">
              Browse Other Categories
            </Link>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedProducts.map((product) => {
                const origPrice = Number(product.price) || 0;
                const discPercent = Number(product.discount) || 0;
                const sellingPrice = discPercent > 0 ? origPrice - (origPrice * discPercent / 100) : origPrice;

                const productImages = (product.images && product.images.length > 0 && !product.images[0].includes('No+Image')) 
                  ? product.images 
                  : (product.imageUrl ? [product.imageUrl] : []);

                return (
                  <div key={product._id || product.id} className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl p-4 text-center hover:border-[#D4AF37]/60 transition-all duration-300 group flex flex-col shadow-lg relative">
                    
                    {/* Product Image Box with 2-Sec Auto-Slider */}
                    <Link to={`/product/${product._id || product.id}`} className="block relative overflow-hidden rounded-lg mb-5 bg-[#111111] aspect-[4/5]">
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

                      {/* Daraz Style Discount Badge */}
                      {discPercent > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-extrabold px-2.5 py-1 rounded shadow-lg z-10 flex items-center">
                          <Tag size={12} className="mr-1" />
                          -{discPercent}% OFF
                        </div>
                      )}

                      {/* Stock Status Badge */}
                      {product.stock <= 0 || product.status === 'Out of Stock' ? (
                        <span className="absolute top-3 right-3 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm z-10 uppercase tracking-wider">Sold Out</span>
                      ) : product.stock <= 5 ? (
                        <span className="absolute top-3 right-3 bg-yellow-500/90 text-black text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm z-10 uppercase tracking-wider">Few Left</span>
                      ) : null}
                    </Link>
                    
                    {/* Product Title */}
                    <Link to={`/product/${product._id || product.id}`} className="mt-auto">
                      <h3 className="font-bold text-white mb-2 hover:text-[#D4AF37] transition-colors line-clamp-2 cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Price Section */}
                    <div className="mb-5 flex items-center justify-center space-x-2">
                      <span className="text-[#D4AF37] font-bold text-xl">{safeSettings?.currency || '৳'} {sellingPrice.toFixed(2)}</span>
                      {discPercent > 0 && (
                        <span className="text-gray-500 line-through text-sm">{safeSettings?.currency || '৳'} {origPrice.toFixed(2)}</span>
                      )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button 
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={product.stock <= 0 || product.status === 'Out of Stock'}
                      className={`w-full flex items-center justify-center space-x-2 border py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
                        product.stock <= 0 || product.status === 'Out of Stock'
                        ? 'bg-[#111111] text-gray-500 border-gray-700 cursor-not-allowed' 
                        : 'border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                      }`}
                    >
                      <ShoppingBag size={18} />
                      <span>{product.stock <= 0 || product.status === 'Out of Stock' ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
                    </button>

                  </div>
                );
              })}
            </div>

            {displayedProducts.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p>No products match your search "{searchQuery}".</p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}