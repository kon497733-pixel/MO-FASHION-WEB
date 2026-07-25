import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft,  ShoppingBag, Search, Tag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCartStore } from '../../store/useCartStore';

export default function CategoryProductsPage() {
  const { id } = useParams(); 
  const { settings } = useSettingsStore();
  const addToCart = useCartStore((state) => state.addToCart);
  
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 🚀 ছবিগুলো প্রতি ২ সেকেন্ডে পরিবর্তন করার জন্য টাইমার স্টেট
  const [imageIndex, setImageIndex] = useState(0);

  // URL থেকে ক্যাটাগরির আসল নাম ডিকোড করা
  const categoryTitle = id ? decodeURIComponent(id) : "Exclusive Collection";

  useEffect(() => {
    const interval = setInterval(() => {
      setImageIndex((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // ডাটাবেস (Local Storage) থেকে রিয়েল প্রোডাক্ট কল করা
    const savedProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');
    
    // Strict Category Matching
    const filtered = savedProducts.filter((product: any) => 
      product.category?.trim().toLowerCase() === categoryTitle.trim().toLowerCase()
    );
    
    setCategoryProducts(filtered.reverse());
    setLoading(false);
  }, [categoryTitle]);

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    const originalPrice = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const sellingPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;

    let productImage = 'No Image';
    if (product.images && product.images.length > 0 && !product.images[0].includes('No+Image')) {
        productImage = product.images[0];
    } else if (product.imageUrl) {
        productImage = product.imageUrl;
    }

    const cartItem = {
      id: String(product._id || product.id || Date.now()),
      name: String(product.name || 'Unnamed Product'),
      price: Number(sellingPrice.toFixed(2)),
      quantity: 1,
      size: product.sizes && product.sizes.length > 0 ? String(product.sizes[0]) : 'M',
      color: product.colors && product.colors.length > 0 ? String(product.colors[0]) : 'Black',
      image: productImage,
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
        <title>{categoryTitle} | {settings?.storeName || 'MO FASHION'}</title>
      </Helmet>

      <div className="container mx-auto px-4">
        
        {/* Back to Categories Button */}
        <Link to="/categories" className="inline-flex items-center text-gray-400 hover:text-[#D4AF37] transition-colors mb-8">
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
          <div className="text-center text-[#D4AF37] py-20 text-xl font-serif animate-pulse">Loading collection...</div>
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
                const originalPrice = Number(product.price) || 0;
                const discount = Number(product.discount) || 0;
                const sellingPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;

                const stockCount = product.stock !== undefined ? Number(product.stock) : 100;
                const isOut = product.status === 'Out of Stock' || stockCount <= 0;

                return (
                  <div key={product._id || product.id} className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl p-4 text-center hover:border-[#D4AF37]/60 transition-all duration-300 group flex flex-col shadow-lg relative">
                    
                    {/* Product Image Box */}
                    <Link to={`/product/${product._id || product.id}`} className="block relative overflow-hidden rounded-lg mb-5 bg-[#111111] aspect-[4/5]">
                      
                      {product.images && product.images.length > 0 && !product.images[0].includes('No+Image') ? (
                        product.images.map((img: string, idx: number) => (
                          <img 
                            key={idx}
                            src={img} 
                            alt={product.name} 
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                              idx === (imageIndex % product.images.length) ? 'opacity-100 group-hover:scale-110 transition-transform' : 'opacity-0'
                            }`}
                          />
                        ))
                      ) : product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <span className="text-xs uppercase tracking-widest text-[#D4AF37]">No Image</span>
                        </div>
                      )}

                      {/* Daraz Style Discount Badge */}
                      {discount > 0 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-extrabold px-3 py-1.5 rounded shadow-lg z-10 flex items-center">
                          <Tag size={12} className="mr-1" />
                          -{discount}% OFF
                        </div>
                      )}

                      {/* Status / Stock Badge */}
                      {isOut ? (
                        <span className="absolute top-3 right-3 bg-red-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm z-10 uppercase tracking-wider">Sold Out</span>
                      ) : stockCount <= 5 ? (
                        <span className="absolute top-3 right-3 bg-yellow-500/90 text-black text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur-sm z-10 uppercase tracking-wider">Few Left</span>
                      ) : null}
                    </Link>
                    
                    {/* Product Info */}
                    <Link to={`/product/${product._id || product.id}`} className="mt-auto">
                      <h3 className="font-bold text-white mb-2 hover:text-[#D4AF37] transition-colors line-clamp-2 cursor-pointer">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Price Section */}
                    <div className="mb-2 flex items-center justify-center space-x-2">
                      <span className="text-[#D4AF37] font-bold text-xl">
                        {settings?.currency || '৳'} {sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {discount > 0 && (
                        <span className="text-gray-500 line-through text-sm">
                          {settings?.currency || '৳'} {originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </div>

                    {/* 🚀 প্রোডাক্ট রিয়েল-টাইম স্টক ইনডিকেটর */}
                    <div className="mb-4">
                      {!isOut ? (
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded border border-green-500/20 inline-block">
                          Stock: {stockCount} items left
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20 inline-block uppercase tracking-wider">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    
                    {/* Add to Cart Button */}
                    <button 
                      onClick={(e) => handleAddToCart(product, e)}
                      disabled={isOut}
                      className={`w-full flex items-center justify-center space-x-2 border py-3 rounded-lg font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
                        isOut
                        ? 'bg-[#111111] text-gray-500 border-gray-700 cursor-not-allowed' 
                        : 'border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                      }`}
                    >
                      <ShoppingBag size={18} />
                      <span>{isOut ? 'OUT OF STOCK' : 'ADD TO CART'}</span>
                    </button>

                  </div>
                );
              })}
            </div>

            {displayedProducts.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p>No products match your search "{searchQuery}".</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-[#D4AF37] hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}