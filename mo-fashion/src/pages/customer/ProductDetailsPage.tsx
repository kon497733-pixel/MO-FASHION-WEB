import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Star, Truck, ShieldCheck, ChevronLeft, Minus, Plus, 
  MapPin, Banknote, RotateCcw, Share2, Heart, 
  X, ZoomIn, ZoomOut, Maximize2 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/useCartStore'; // 🚀 কার্ট স্টোর ইমপোর্ট করা হলো

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 🚀 গ্লোবাল কার্ট স্টোর থেকে addToCart ফাংশন আনা হলো
  const addToCart = useCartStore((state) => state.addToCart);

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');
  
  const [mainImage, setMainImage] = useState('');

  // ফুল-স্ক্রিন ইমেজ এবং জুমের স্টেট (অপরিবর্তিত)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 🚀 ডাইনামিক সেটিংস (Shipping Charge এর জন্য)
  const [siteSettings, setSiteSettings] = useState<any>({
    currency: '৳',
    shippingInside: 60,
    shippingOutside: 150,
    enableCOD: true
  });

  useEffect(() => {
    // 🚀 সেটিংস লোড করা
    const savedSettings = localStorage.getItem('mo_fashion_settings');
    if (savedSettings) {
      setSiteSettings(JSON.parse(savedSettings));
    }

    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`https://mo-fashion-backend.onrender.com/api/products/${id}`);
        const data = await res.json();

        if (res.ok && !data.message) {
          setProduct(data);
          if (data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[0]);
          if (data.colors && data.colors.length > 0) setSelectedColor(data.colors[0]);
          
          if (data.images && data.images.length > 0 && !data.images[0].includes('No+Image')) {
            setMainImage(data.images[0]);
          } else if (data.imageUrl) {
            setMainImage(data.imageUrl);
          }
          setLoading(false);
          return; 
        }
      } catch (err) {
        console.log("Backend API not reached or ID mismatch, falling back to local storage...");
      }

      const localProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');
      const foundProduct = localProducts.find((p: any) => String(p._id || p.id) === String(id));

      if (foundProduct) {
        setProduct(foundProduct);
        if (foundProduct.sizes && foundProduct.sizes.length > 0) setSelectedSize(foundProduct.sizes[0]);
        if (foundProduct.colors && foundProduct.colors.length > 0) setSelectedColor(foundProduct.colors[0]);
        
        if (foundProduct.images && foundProduct.images.length > 0 && !foundProduct.images[0].includes('No+Image')) {
          setMainImage(foundProduct.images[0]);
        } else if (foundProduct.imageUrl) {
          setMainImage(foundProduct.imageUrl);
        }
      } else {
        setProduct(null); 
      }
      
      setLoading(false);
    };

    fetchProductDetails();
  }, [id]);

  // 🚀 স্টক হিসাব এবং আউট অফ স্টক স্ট্যাটাস নির্ণয়
  const availableStock = product ? (product.stock !== undefined ? Number(product.stock) : (product.status === 'Out of Stock' ? 0 : 100)) : 0;
  const isOutOfStock = availableStock <= 0 || (product && product.status === 'Out of Stock');

  // স্টক অনুযায়ী কোয়ান্টিটি কন্ট্রোল (স্টকের বেশি সিলেক্ট করা যাবে না)
  const maxAllowedQuantity = Math.min(10, availableStock > 0 ? availableStock : 1);
  const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  const increaseQuantity = () => setQuantity(prev => (prev < maxAllowedQuantity ? prev + 1 : maxAllowedQuantity));

  // 🚀 Add to Cart পারফেক্টলি ফিক্সড (স্টক চেক সহ)
  const handleAddToCart = () => {
    if (!product || isOutOfStock) {
      toast.error('This product is currently out of stock!');
      return;
    }

    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} items left in stock!`);
      return;
    }

    const originalPrice = Number(product.price) || 0;
    const discountPercent = Number(product.discount) || 0;
    const sellingPrice = discountPercent > 0 ? originalPrice - (originalPrice * discountPercent / 100) : originalPrice;

    const cartItem = {
      id: String(product._id || product.id),
      name: String(product.name),
      price: sellingPrice,
      quantity: quantity,
      size: selectedSize,
      color: selectedColor,
      imageUrl: mainImage || (product.images && product.images[0]) || product.imageUrl || '',
      stock: availableStock
    };

    addToCart(cartItem as any);
    toast.success(`${quantity}x ${product.name} added to cart!`);
  };

  // 🚀 Buy Now পারফেক্টলি ফিক্সড
  const handleBuyNow = () => {
    if (!product || isOutOfStock) {
      toast.error('This product is currently out of stock!');
      return;
    }
    handleAddToCart();
    navigate('/cart');
  };

  // জুম ইন/আউট ফাংশন (অপরিবর্তিত)
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 4)); 
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1)); 
  
  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setZoomLevel(1); 
    setPosition({ x: 0, y: 0 }); 
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      handleZoomIn(); 
    } else {
      handleZoomOut(); 
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111111]">
        <h2 className="text-2xl font-serif text-[#D4AF37] animate-pulse">Loading Premium Content...</h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111111] text-center px-4">
        <h2 className="text-3xl font-bold text-red-500 mb-4">Product Not Found!</h2>
        <p className="text-gray-400 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/" className="bg-[#D4AF37] text-black px-6 py-2 rounded font-bold hover:bg-white transition-colors">
          Go Back Home
        </Link>
      </div>
    );
  }

  const displaySizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'];
  const displayColors = product.colors && product.colors.length > 0 ? product.colors : ['Black', 'Gold', 'White'];
  
  const galleryImages = product.images && product.images.length > 0 && !product.images[0].includes('No+Image') 
    ? product.images 
    : (product.imageUrl ? [product.imageUrl] : []);

  return (
    <main className="min-h-screen py-8 bg-[#111111] text-white">
      <div className="container mx-auto px-4">
        
        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 mb-6 flex items-center space-x-2">
          <Link to="/" className="hover:text-[#D4AF37] transition-colors">
            <ChevronLeft size={16} className="inline mr-1 mb-0.5" />Home
          </Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-[#D4AF37] transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-[#D4AF37] truncate">{product.name}</span>
        </div>

        {/* Main Product Section (3 Columns Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Column 1: Image Gallery (Left) */}
          <div className="lg:col-span-4 space-y-4">
            
            <div 
              onClick={() => mainImage && setIsLightboxOpen(true)}
              className={`bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl aspect-square flex items-center justify-center overflow-hidden relative group ${mainImage ? 'cursor-zoom-in' : 'cursor-default'}`}
              title={mainImage ? "Click to view full screen" : ""}
            >
              {mainImage ? (
                <>
                  <img src={mainImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Maximize2 size={36} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </>
              ) : (
                <span className="text-xl uppercase tracking-widest text-gray-500">No Image</span>
              )}

              {/* আউট অফ স্টক ওভারলে ব্যাজ */}
              {isOutOfStock && (
                <div className="absolute top-3 left-3 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider shadow-lg">
                  Out of Stock
                </div>
              )}
            </div>
            
            {/* Thumbnails Slider */}
            {galleryImages.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto custom-scrollbar pb-2">
                {galleryImages.map((img: string, idx: number) => (
                  <div 
                    key={idx} 
                    onClick={() => setMainImage(img)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      mainImage === img ? 'border-[#D4AF37]' : 'border-transparent hover:border-[#D4AF37]/50'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Product Info & Actions (Middle) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white leading-tight">
                {product.name}
              </h1>
              <div className="flex space-x-3 text-gray-400">
                <button className="hover:text-[#D4AF37] transition-colors"><Share2 size={20} /></button>
                <button className="hover:text-red-500 transition-colors"><Heart size={20} /></button>
              </div>
            </div>

            <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-800">
              <div className="flex text-[#D4AF37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-blue-400 text-sm hover:underline cursor-pointer">
                {product.reviews || 24} Ratings
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400 text-sm">Brand: <span className="text-blue-400 hover:underline cursor-pointer">MO Premium</span></span>
            </div>

            {/* প্রাইস ও স্টক স্ট্যাটাস সেকশন */}
            <div className="mb-6">
              <p className="text-4xl font-bold text-[#D4AF37] mb-2">${(Number(product.price) || 0).toFixed(2)}</p>
              {product.discount > 0 && (
                 <p className="text-gray-500 line-through text-sm mb-2">
                   ${(Number(product.price) / (1 - product.discount/100)).toFixed(2)} 
                   <span className="text-red-400 font-bold ml-2">-{product.discount}%</span>
                 </p>
              )}

              {/* 🚀 স্টক স্ট্যাটাস ব্যাজ (In Stock / Out of Stock) */}
              <div className="inline-block mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isOutOfStock 
                    ? 'bg-red-500/10 text-red-500 border-red-500/30' 
                    : 'bg-green-500/10 text-green-400 border-green-500/30'
                }`}>
                  {isOutOfStock ? '● Out of Stock' : `● In Stock (${availableStock} items left)`}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-400 mb-2 text-sm">Color Family: <span className="text-white font-bold ml-1">{selectedColor}</span></h3>
              <div className="flex flex-wrap gap-3">
                {displayColors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all border ${
                      selectedColor === color 
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]' 
                        : 'border-gray-700 text-gray-300 hover:border-[#D4AF37]'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-400 mb-2 text-sm">Size: <span className="text-white font-bold ml-1">{selectedSize}</span></h3>
              <div className="flex flex-wrap gap-3">
                {displaySizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[40px] h-10 px-2 rounded-md font-medium transition-all flex items-center justify-center border ${
                      selectedSize === size 
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]' 
                        : 'border-gray-700 text-gray-300 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* কোয়ান্টিটি কাউন্টার */}
            <div className="mb-8 flex items-center space-x-4">
              <h3 className="text-gray-400 text-sm">Quantity</h3>
              <div className={`flex items-center border border-gray-600 bg-[#1A1A1A] rounded-md h-10 w-28 ${isOutOfStock ? 'opacity-40 pointer-events-none' : ''}`}>
                <button onClick={decreaseQuantity} className="px-3 text-gray-400 hover:text-[#D4AF37] transition-colors"><Minus size={16} /></button>
                <span className="flex-1 text-center font-bold text-white">{quantity}</span>
                <button onClick={increaseQuantity} className="px-3 text-gray-400 hover:text-[#D4AF37] transition-colors"><Plus size={16} /></button>
              </div>
            </div>

            {/* বাটন সেকশন (Buy Now & Add to Cart) */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button 
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`flex-1 h-12 rounded-md font-bold uppercase tracking-wider transition-all ${
                  isOutOfStock 
                    ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                }`}
              >
                {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
              </button>

              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 h-12 flex items-center justify-center space-x-2 rounded-md font-bold uppercase tracking-wider transition-colors ${
                  isOutOfStock 
                    ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed' 
                    : 'bg-[#D4AF37] text-black hover:bg-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                }`}
              >
                <ShoppingBag size={20} />
                <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>

          {/* Column 3: Delivery Info (Right) 🚀 ডাইনামিক শিপিং চার্জ */}
          <div className="lg:col-span-3">
            <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 p-5 space-y-6 sticky top-24">
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold">Delivery Options</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin size={20} className="text-[#D4AF37] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">Inside Chittagong</p>
                      <p className="text-xs text-gray-500">Delivery in 1-2 Days</p>
                    </div>
                    <span className="text-white font-bold text-sm">{siteSettings.currency} {siteSettings.shippingInside}</span>
                  </div>
                  <div className="flex items-start space-x-3 border-t border-gray-800 pt-4">
                    <Truck size={20} className="text-[#D4AF37] mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">Outside Chittagong</p>
                      <p className="text-xs text-gray-500">Delivery in 3-5 Days</p>
                    </div>
                    <span className="text-white font-bold text-sm">{siteSettings.currency} {siteSettings.shippingOutside}</span>
                  </div>
                  {siteSettings.enableCOD && (
                    <div className="flex items-start space-x-3 border-t border-gray-800 pt-4">
                      <Banknote size={20} className="text-[#D4AF37] mt-0.5" />
                      <p className="text-sm text-white flex-1">Cash on Delivery Available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-4">Return & Warranty</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <RotateCcw size={20} className="text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-white">14 days easy return</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="bg-[#1A1A1A] rounded-xl border border-gray-800 overflow-hidden mb-8">
          <div className="bg-[#111111] px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">Product details of {product.name}</h2>
          </div>
          <div className="p-6 md:p-8">
            <div className="prose prose-invert max-w-none text-gray-400">
              <p className="mb-6 whitespace-pre-wrap leading-relaxed">{product.description || 'No detailed description available for this product.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Image Lightbox (Zoom In/Out Feature) */}
      {isLightboxOpen && mainImage && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <div className="absolute top-6 right-6 flex items-center space-x-3 z-50 bg-[#1A1A1A] p-2 rounded-full border border-gray-700 shadow-2xl">
            <button onClick={handleZoomOut} disabled={zoomLevel <= 1} className="p-2 text-white hover:text-[#D4AF37] disabled:opacity-30 transition-colors" title="Zoom Out">
              <ZoomOut size={24} />
            </button>
            <span className="text-white font-bold min-w-[3rem] text-center text-sm">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={handleZoomIn} disabled={zoomLevel >= 4} className="p-2 text-white hover:text-[#D4AF37] disabled:opacity-30 transition-colors" title="Zoom In">
              <ZoomIn size={24} />
            </button>
            <div className="w-px h-6 bg-gray-600 mx-2"></div>
            <button onClick={handleCloseLightbox} className="p-2 text-red-500 hover:text-red-400 transition-colors" title="Close">
              <X size={28} />
            </button>
          </div>
          <div 
            className={`w-full h-full overflow-hidden flex items-center justify-center p-4 ${zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <img 
              src={mainImage} 
              alt={product.name} 
              className="transition-transform duration-300 object-contain max-h-[90vh] max-w-full select-none pointer-events-none"
              style={{ transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`, cursor: zoomLevel > 1 ? 'inherit' : 'default' }}
            />
          </div>
        </div>
      )}
    </main>
  );
}