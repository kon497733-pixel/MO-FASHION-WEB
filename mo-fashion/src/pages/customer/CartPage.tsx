import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, Ticket, Image as ImageIcon, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/useCartStore';
import { useSettingsStore } from '../../store/useSettingsStore';

// 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ ইমপোর্ট (কুপন লাইভ চেক করার জন্য)
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const { settings } = useSettingsStore();
  const safeSettings = settings as any;

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [liveSettings, setLiveSettings] = useState<any>(null);
  const [deliveryLocation, setDeliveryLocation] = useState('inside');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // রিয়েল টাইমে ডাটাবেস থেকে প্রোডাক্ট এবং সেটিংস ফেচ করা
  useEffect(() => {
    const fetchData = async () => {
      // ১. প্রোডাক্ট ফেচ (Render API থেকে)
      try {
        const prodRes = await fetch('https://mo-fashion-api-mehedi.onrender.com/api/products');
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setDbProducts(prods);
        }
      } catch (e) {
        const localProds = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');
        setDbProducts(localProds);
      }

      // ২. সেটিংস ফেচ (Local Storage থেকে দ্রুত লোড)
      const localSettings = JSON.parse(localStorage.getItem('mo_fashion_settings') || '{}');
      if (Object.keys(localSettings).length > 0) {
        setLiveSettings(localSettings);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (items.length === 0 && appliedCoupon) {
      removeCoupon();
    }
  }, [items.length, appliedCoupon, removeCoupon]);

  const activeSettings = liveSettings || safeSettings;

  let totalOriginalPrice = 0;
  let totalProductDiscount = 0;
  let subtotalAfterProductDiscount = 0;

  const enrichedCartItems = items.map((cartItem: any) => {
    const dbProduct = dbProducts.find((p) => String(p._id || p.id) === String(cartItem.id));
    
    const originalPrice = dbProduct ? Number(dbProduct.price) : Number(cartItem.price);
    const discountPercent = dbProduct ? Number(dbProduct.discount) || 0 : 0;
    
    const discountAmountPerItem = (originalPrice * discountPercent) / 100;
    const sellingPrice = originalPrice - discountAmountPerItem;

    let productImage = '';
    if (dbProduct) {
       if (dbProduct.images && dbProduct.images.length > 0 && !dbProduct.images[0].includes('No+Image')) {
           productImage = dbProduct.images[0];
       } else if (dbProduct.imageUrl) {
           productImage = dbProduct.imageUrl;
       }
    }
    if (!productImage) {
      productImage = cartItem.image || cartItem.imageUrl || '';
    }

    const itemOriginalTotal = originalPrice * cartItem.quantity;
    const itemDiscountTotal = discountAmountPerItem * cartItem.quantity;
    const itemSubtotal = sellingPrice * cartItem.quantity;

    totalOriginalPrice += itemOriginalTotal;
    totalProductDiscount += itemDiscountTotal;
    subtotalAfterProductDiscount += itemSubtotal;

    return {
      ...cartItem,
      displayImage: productImage, 
      originalPrice,
      discountPercent,
      sellingPrice,
      itemSubtotal,
      stock: dbProduct ? Number(dbProduct.stock) : cartItem.stock
    };
  });

  const shippingInside = Number(activeSettings.shippingInside) || 60;
  const shippingOutside = Number(activeSettings.shippingOutside) || 150;
  const shipping = enrichedCartItems.length > 0 
    ? (deliveryLocation === 'inside' ? shippingInside : shippingOutside) 
    : 0;

  const taxRate = activeSettings.taxRate !== undefined && activeSettings.taxRate !== '' ? Number(activeSettings.taxRate) : 0; 
  const taxAmount = (subtotalAfterProductDiscount * taxRate) / 100;
  
  const totalBeforeCoupon = subtotalAfterProductDiscount + shipping + taxAmount;

  // কুপন ডিসকাউন্ট হিসাব
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      couponDiscountAmount = (totalBeforeCoupon * appliedCoupon.discountValue) / 100;
    } else {
      couponDiscountAmount = appliedCoupon.discountValue;
    }
    
    if (couponDiscountAmount > totalBeforeCoupon) {
      couponDiscountAmount = totalBeforeCoupon;
    }
  }

  const grandTotal = Math.max(0, totalBeforeCoupon - couponDiscountAmount);

  // 🚀 লাইভ ক্লাউড ডাটাবেস থেকে কুপন চেক ও অ্যাপ্লাই করার লজিক (যেকোনো ডিভাইসের জন্য)
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code!');
      return;
    }

    setIsApplyingCoupon(true);
    const toastId = toast.loading('Checking coupon validity...');

    try {
      // 🚀 ১. ফায়ারবেস ক্লাউড থেকে সরাসরি সব কুপন ফেচ করা
      const querySnapshot = await getDocs(collection(db, 'coupons'));
      const cloudCoupons: any[] = [];
      querySnapshot.forEach((docSnap) => {
        cloudCoupons.push({ id: docSnap.id, ...docSnap.data() });
      });

      // ২. কুপন খোঁজা
      const validCoupon = cloudCoupons.find((c: any) => c.code === couponInput.trim().toUpperCase());

      if (!validCoupon) {
        toast.error('Invalid coupon code!', { id: toastId });
        setIsApplyingCoupon(false);
        return;
      }

      // ৩. অ্যাকটিভ স্ট্যাটাস চেক
      if (validCoupon.status !== 'Active') {
        toast.error('This coupon has expired or is inactive!', { id: toastId });
        setIsApplyingCoupon(false);
        return;
      }

      // ৪. লিমিট চেক
      if (Number(validCoupon.used) >= Number(validCoupon.usageLimit)) {
        toast.error('This coupon has reached its maximum usage limit!', { id: toastId });
        setIsApplyingCoupon(false);
        return;
      }

      // ৫. ডেট চেক
      const today = new Date().toISOString().split('T')[0];
      if (validCoupon.expiry && validCoupon.expiry < today) {
        toast.error('This coupon has expired!', { id: toastId });
        setIsApplyingCoupon(false);
        return;
      }

      let discountValue = 0;
      let discountType: 'percentage' | 'fixed' = 'fixed';
      const discountStr = String(validCoupon.discount || '').trim();

      if (discountStr.includes('%')) {
        discountValue = Number(discountStr.replace(/[^0-9.]/g, ''));
        discountType = 'percentage';
      } else {
        discountValue = Number(discountStr.replace(/[^0-9.]/g, ''));
        discountType = 'fixed';
      }

      // 🚀 গ্লোবাল স্টোরে কুপন সেভ করা
      applyCoupon({ 
        code: validCoupon.code, 
        discountValue: discountValue, 
        discountType: discountType 
      });
      
      toast.success(`Coupon ${validCoupon.code} applied successfully!`, { id: toastId });
      setCouponInput('');

    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error('Failed to connect to cloud database!', { id: toastId });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  return (
    <main className="min-h-screen py-10 bg-[#111111] text-white">
      <Helmet>
        <title>Shopping Cart | {activeSettings.storeName}</title>
      </Helmet>

      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#D4AF37] mb-8 uppercase tracking-wider">
          Shopping Cart
        </h1>

        {enrichedCartItems.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-[#D4AF37]/20 shadow-2xl max-w-3xl mx-auto">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-serif font-bold text-white mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Looks like you haven't added any premium products yet.</p>
            <Link to="/categories" className="inline-block bg-[#D4AF37] text-black px-8 py-3 rounded-lg hover:bg-white transition-colors font-bold uppercase tracking-wider shadow-lg">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-8">
            
            {/* Left Side: Cart Items */}
            <div className="xl:w-2/3 space-y-4">
              {enrichedCartItems.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-center gap-6 bg-[#1A1A1A] p-4 sm:p-6 rounded-xl border border-[#D4AF37]/20 relative group hover:border-[#D4AF37]/50 transition-colors shadow-lg">
                  
                  {/* Product Image */}
                  <Link to={`/product/${item.id}`} className="w-24 h-24 sm:w-28 sm:h-28 bg-[#111111] border border-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                    {item.displayImage && item.displayImage !== 'No Image' ? (
                      <img src={item.displayImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <ImageIcon size={32} className="text-gray-600" />
                    )}
                    {item.discountPercent > 0 && (
                      <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
                        -{item.discountPercent}%
                      </div>
                    )}
                  </Link>
                  
                  {/* Product Info */}
                  <div className="flex-grow text-center sm:text-left w-full">
                    <Link to={`/product/${item.id}`}>
                      <h3 className="font-bold text-lg text-white hover:text-[#D4AF37] transition-colors cursor-pointer line-clamp-2">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-400 mb-3 mt-1">
                      Color: <span className="text-white">{item.color}</span> | Size: <span className="text-white">{item.size}</span>
                    </p>
                    
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <span className="text-[#D4AF37] font-bold text-xl">{activeSettings.currency} {item.sellingPrice.toFixed(2)}</span>
                      {item.discountPercent > 0 && (
                        <span className="text-gray-500 line-through text-sm">{activeSettings.currency} {item.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center space-x-3 bg-[#111111] border border-gray-700 rounded-full px-3 py-1.5 my-2 sm:my-0 shadow-inner">
                    <button 
                      onClick={() => updateQuantity(item.id, item.size, item.color, 'decrease')} 
                      className="text-gray-400 hover:text-[#D4AF37] transition-colors p-1 disabled:opacity-50"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold w-6 text-center text-white">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.size, item.color, 'increase')} 
                      className="text-gray-400 hover:text-[#D4AF37] transition-colors p-1 disabled:opacity-50"
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Item Subtotal */}
                  <div className="hidden sm:block text-right min-w-[100px]">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total</p>
                    <p className="font-bold text-white">{activeSettings.currency} {item.itemSubtotal.toFixed(2)}</p>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => {
                      removeFromCart(item.id, item.size, item.color);
                      toast.success('Item removed from cart!');
                    }}
                    className="absolute top-4 right-4 sm:static text-gray-500 hover:text-red-500 transition-colors p-2 bg-[#111111] sm:bg-transparent rounded-md border border-gray-800 sm:border-transparent"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {/* Right Side: Order Summary */}
            <div className="xl:w-1/3">
              <div className="bg-[#1A1A1A] p-6 sm:p-8 rounded-xl border border-[#D4AF37]/20 sticky top-24 shadow-2xl">
                <h2 className="text-xl font-serif font-bold text-[#D4AF37] mb-6 border-b border-[#D4AF37]/20 pb-4 uppercase tracking-wider">
                  Order Summary
                </h2>
                
                <div className="space-y-4 text-sm mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Original Price ({enrichedCartItems.length} items)</span>
                    <span className="font-medium">{activeSettings.currency} {totalOriginalPrice.toFixed(2)}</span>
                  </div>

                  {totalProductDiscount > 0 && (
                    <div className="flex justify-between text-green-400 font-medium">
                      <span>Product Discount Saved</span>
                      <span>-{activeSettings.currency} {totalProductDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-y border-gray-800 py-4 my-2">
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-3 flex items-center">
                      <MapPin size={14} className="mr-1 text-[#D4AF37]" /> Select Delivery Area
                    </p>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="location" 
                          value="inside" 
                          checked={deliveryLocation === 'inside'}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                          className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">Inside Chittagong ({activeSettings.currency} {shippingInside})</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="location" 
                          value="outside" 
                          checked={deliveryLocation === 'outside'}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                          className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">Outside Chittagong ({activeSettings.currency} {shippingOutside})</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-gray-300 font-medium pt-2">
                    <span>Shipping Fee</span>
                    <span className="text-white">{activeSettings.currency} {shipping.toFixed(2)}</span>
                  </div>

                  {taxRate > 0 && (
                    <div className="flex justify-between text-gray-300 font-medium">
                      <span>Estimated Tax ({taxRate}%)</span>
                      <span className="text-white">{activeSettings.currency} {taxAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-800">
                    <span className="text-white font-medium">Total Before Discount</span>
                    <span className="text-white">{activeSettings.currency} {totalBeforeCoupon.toFixed(2)}</span>
                  </div>
                  
                  {/* 🚀 Applied Coupon Display */}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-green-400 font-bold bg-green-500/10 p-3 rounded-lg border border-green-500/20 mt-2">
                      <div className="flex flex-col">
                        <span className="flex items-center">
                          <Ticket size={14} className="mr-1"/> Coupon ({appliedCoupon.code})
                          {appliedCoupon.discountType === 'percentage' && (
                            <span className="ml-2 bg-green-500 text-black text-[10px] px-1.5 py-0.5 rounded-sm">
                              {appliedCoupon.discountValue}% OFF
                            </span>
                          )}
                        </span>
                        <button onClick={() => { removeCoupon(); toast.success('Coupon removed!'); }} className="text-xs text-red-400 hover:underline text-left mt-1">Remove</button>
                      </div>
                      <span>-{activeSettings.currency} {couponDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-[#D4AF37]/30 pt-5 mb-8 flex justify-between items-end">
                  <span className="font-serif font-bold text-lg text-white">Grand Total</span>
                  <span className="font-bold text-3xl text-[#D4AF37]">{activeSettings.currency} {grandTotal.toFixed(2)}</span>
                </div>

                {/* 🚀 Coupon Input Area */}
                {!appliedCoupon && (
                  <div className="mb-6 relative">
                    <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">Have a Promo Code?</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter code..." 
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] placeholder-gray-600 transition-colors uppercase"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon}
                        className="bg-[#D4AF37]/10 border border-[#D4AF37] text-[#D4AF37] px-6 py-3 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-colors font-bold uppercase tracking-wider disabled:opacity-50"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                <Link to="/checkout">
                  <button className="w-full bg-[#D4AF37] text-black py-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-white transition-colors font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={20} />
                  </button>
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}