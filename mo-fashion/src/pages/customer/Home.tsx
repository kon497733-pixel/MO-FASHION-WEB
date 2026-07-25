import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShoppingBag, Image as ImageIcon, Search, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/useCartStore';
// 🚀 ফায়ারবেস ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default function Home() {
  const addToCart = useCartStore((state) => state.addToCart);

  const [siteSettings, setSiteSettings] = useState<any>({
    storeName: 'MO FASHION',
    tagline: 'Premium E-Commerce Experience.',
    currency: '$'
  });

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚀 ফায়ারবেস থেকে কাস্টমারের জন্য রিয়েল-টাইম প্রোডাক্ট আনা
  const fetchLiveProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const prodsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProducts(prodsArray);
    } catch (error) {
      console.error("Error fetching live products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();

    // সেটিংস লোড করা (আপনার ল্যাপটপের সেভ করা)
    const savedSettings = localStorage.getItem('mo_fashion_settings');
    if (savedSettings) {
      try { setSiteSettings(JSON.parse(savedSettings)); } catch (e) {}
    }
  }, []);

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    const originalPrice = Number(product.price) || 0;
    const discount = Number(product.discount) || 0;
    const sellingPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;

    const cartItem = {
      id: product.id,
      name: String(product.name),
      price: Number(sellingPrice.toFixed(2)),
      quantity: 1,
      size: 'M',
      color: 'Black',
      image: (product.images && product.images[0]) || product.imageUrl || '',
      stock: Number(product.stock) || 0
    };

    addToCart(cartItem as any);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <main className="min-h-screen bg-[#111111] pb-12 text-white">
      <Helmet><title>{siteSettings?.storeName || 'MO FASHION'} | Home</title></Helmet>

      <section className="bg-[#1A1A1A] py-24 text-center border-b border-[#D4AF37]/20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 uppercase tracking-widest">
            Welcome to <span className="text-[#D4AF37]">{siteSettings?.storeName || 'MO FASHION'}</span>
          </h1>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto text-lg md:text-xl font-light">
            {siteSettings?.tagline}
          </p>
          <Link to="/categories">
            <button className="bg-[#D4AF37] text-black px-10 py-4 rounded-lg font-bold uppercase shadow-lg">Shop Now</button>
          </Link>
        </div>
      </section>

      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#D4AF37] tracking-wider mb-4 uppercase">NEW ARRIVALS</h2>
        </div>

        {loading ? (
          <div className="text-center text-[#D4AF37] py-10 animate-pulse">Loading products from live database...</div>
        ) : allProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-dashed border-gray-800 shadow-lg">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-6" />
            <h2 className="text-2xl font-serif font-bold text-white mb-2">No Products Available</h2>
            <p className="text-gray-400">Products will appear here once added to the live database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allProducts.map((product) => {
              const originalPrice = Number(product.price) || 0;
              const discount = Number(product.discount) || 0;
              const sellingPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;
              const stockCount = product.stock !== undefined ? Number(product.stock) : 0;
              const isOut = product.status === 'Out of Stock' || stockCount <= 0;

              return (
                <div key={product.id} className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl p-4 text-center hover:border-[#D4AF37] transition-all flex flex-col shadow-lg relative">
                  <Link to={`/product/${product.id}`} className="block relative overflow-hidden rounded-lg mb-5 bg-[#111111] aspect-[4/5]">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">No Image</div>
                    )}
                    {discount > 0 && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">-{discount}% OFF</div>
                    )}
                    {isOut && <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Sold Out</span>}
                  </Link>

                  <h3 className="font-bold text-white mb-2 line-clamp-2">{product.name}</h3>
                  <div className="mb-2 flex justify-center space-x-2">
                    <span className="text-[#D4AF37] font-bold text-xl">{siteSettings?.currency} {sellingPrice.toFixed(2)}</span>
                  </div>

                  <div className="mb-4">
                    {!isOut ? (
                      <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">Stock: {stockCount} items left</span>
                    ) : (
                      <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 uppercase">Out of Stock</span>
                    )}
                  </div>
                  
                  <button onClick={(e) => handleAddToCart(product, e)} disabled={isOut} className={`w-full border py-3 rounded-lg font-bold uppercase text-sm ${isOut ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' : 'border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black'}`}>
                    {isOut ? 'OUT OF STOCK' : 'ADD TO CART'}
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