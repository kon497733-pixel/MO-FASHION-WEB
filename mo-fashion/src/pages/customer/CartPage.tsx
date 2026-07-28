import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag, Ticket, Image as ImageIcon, ShieldCheck, Truck, RotateCcw, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../../store/useCartStore';

export default function CartPage() {
  const navigate = useNavigate();

  // 🚀 TS Error Fixed by using 'any' type for the entire store
  const cartStore = useCartStore() as any;
  const { items, appliedCoupon, applyCoupon, removeCoupon } = cartStore;

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'inside' | 'outside'>('inside');

  const [siteSettings, setSiteSettings] = useState<any>({
    storeName: 'MO FASHION',
    currency: '৳',
    taxRate: 0,
    shippingInside: 60,
    shippingOutside: 150,
  });

  useEffect(() => {
    // কার্ট পেজে আসলে আগের কুপন মুছে যাবে, কাস্টমারকে আবার দিতে হবে
    if (typeof removeCoupon === 'function') removeCoupon();

    const savedProducts = localStorage.getItem('mo_fashion_products');
    if (savedProducts) setDbProducts(JSON.parse(savedProducts));

    const savedSettings = localStorage.getItem('mo_fashion_settings');
    if (savedSettings) setSiteSettings(JSON.parse(savedSettings));
  }, []);

  // 🚀 Fallback Functions for Cart Operations
  const safeIncrease = (id: string, size: string, color: string) => {
    if (cartStore.increaseQuantity) cartStore.increaseQuantity(id);
    else if (cartStore.updateQuantity) cartStore.updateQuantity(id, size, color, 'increase');
  };

  const safeDecrease = (id: string, size: string, color: string) => {
    if (cartStore.decreaseQuantity) cartStore.decreaseQuantity(id);
    else if (cartStore.updateQuantity) cartStore.updateQuantity(id, size, color, 'decrease');
  };

  const safeRemove = (id: string, size: string, color: string) => {
    if (cartStore.removeFromCart) {
      try { cartStore.removeFromCart(id); } 
      catch (e) { cartStore.removeFromCart(id, size, color); }
    }
  };

  let totalOriginalPrice = 0;
  let totalProductDiscount = 0;
  let subtotalAfterProductDiscount = 0;

  // 🚀 Enriched Cart Items with Real-time DB matching
  const enrichedCartItems = (items || []).map((cartItem: any) => {
    const dbProduct = dbProducts.find((p) => String(p.id || p._id) === String(cartItem.id));
    
    const originalPrice = dbProduct ? Number(dbProduct.price) : Number(cartItem.price);
    const discountPercent = dbProduct ? Number(dbProduct.discount) || 0 : 0;
    
    const discountAmountPerItem = (originalPrice * discountPercent) / 100;
    const sellingPrice = originalPrice - discountAmountPerItem;
    
    const itemOriginalTotal = originalPrice * cartItem.quantity;
    const itemDiscountTotal = discountAmountPerItem * cartItem.quantity;
    const itemSubtotal = sellingPrice * cartItem.quantity;

    totalOriginalPrice += itemOriginalTotal;
    totalProductDiscount += itemDiscountTotal;
    subtotalAfterProductDiscount += itemSubtotal;

    // 🚀 Picture Issue Fixed: Taking image from cartItem instead of DB to prevent missing images
    return {
      ...cartItem,
      originalPrice,
      discountPercent,
      sellingPrice,
      itemSubtotal,
      image: cartItem.image && cartItem.image !== 'No Image' ? cartItem.image : (dbProduct?.images?.[0] || dbProduct?.imageUrl || ''),
      stock: dbProduct ? Number(dbProduct.stock) : cartItem.stock
    };
  });

  // 🚀 Coupon Discount Calculation
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      couponDiscountAmount = (subtotalAfterProductDiscount * appliedCoupon.discountValue) / 100;
    } else {
      couponDiscountAmount = appliedCoupon.discountValue;
    }
    if (couponDiscountAmount > subtotalAfterProductDiscount) {
      couponDiscountAmount = subtotalAfterProductDiscount;
    }
  }

  // 🚀 Shipping & Tax Calculation
  const shippingInside = Number(siteSettings.shippingInside) || 60;
  const shippingOutside = Number(siteSettings.shippingOutside) || 150;
  const shipping = enrichedCartItems.length > 0 ? (deliveryArea === 'inside' ? shippingInside : shippingOutside) : 0;
  
  const subtotalAfterCoupon = subtotalAfterProductDiscount - couponDiscountAmount;
  const taxRate = Number(siteSettings.taxRate) || 0; 
  const taxAmount = (subtotalAfterCoupon * taxRate) / 100;
  
  const grandTotal = Math.max(0, subtotalAfterCoupon + shipping + taxAmount);

  // Apply Coupon Logic
  const handleApplyCoupon = () => {
    if (!couponInput.trim()) {
      toast.error('Please enter a coupon code!');
      return;
    }
    const savedCoupons = JSON.parse(localStorage.getItem('mo_fashion_coupons') || '[]');
    const validCoupon = savedCoupons.find((c: any) => c.code === couponInput.trim().toUpperCase() && c.status === 'Active');

    if (validCoupon) {
      const discountValue = Number(validCoupon.discountValue);
      const discountType = validCoupon.type.toLowerCase(); 
      if (typeof applyCoupon === 'function') {
        applyCoupon({ code: validCoupon.code, discountValue, discountType } as any);
      }
      toast.success(`Coupon ${validCoupon.code} applied successfully!`);
      setCouponInput('');
    } else {
      toast.error('Invalid or expired coupon code!');
    }
  };

  return (
    <main className="min-h-screen py-12 bg-[#0a0a0a] text-white">
      <Helmet>
        <title>Shopping Cart | {siteSettings?.storeName || 'MO FASHION'}</title>
      </Helmet>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Amazon-style Breadcrumb / Secure Checkout Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#D4AF37] tracking-wider uppercase">
            Your Shopping Cart
          </h1>
          <div className="hidden sm:flex items-center space-x-2 text-gray-500 text-sm">
            <ShieldCheck size={18} className="text-green-500" />
            <span>Secure 256-bit SSL Checkout</span>
          </div>
        </div>

        {enrichedCartItems.length === 0 ? (
          <div className="text-center py-24 bg-[#111111] rounded-2xl border border-gray-800 shadow-2xl max-w-3xl mx-auto relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <ShoppingBag size={80} className="mx-auto text-gray-700 mb-6 group-hover:text-[#D4AF37] transition-colors duration-500" strokeWidth={1} />
            <h2 className="text-3xl font-serif font-bold text-white mb-4">Your MO Cart is Empty</h2>
            <p className="text-gray-400 mb-10 text-lg">Indulge in luxury. Discover our premium collections and elevate your style.</p>
            <Link to="/categories" className="inline-block bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] px-10 py-3.5 rounded-full hover:bg-[#D4AF37] hover:text-black transition-all duration-300 font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* 🚀 Left Side: Luxury Cart Items */}
            <div className="lg:w-2/3 space-y-6">
              
              {/* Trust Badges */}
              <div className="bg-[#111111] border border-gray-800 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-around text-xs sm:text-sm text-gray-400">
                <span className="flex items-center"><RotateCcw size={16} className="mr-2 text-[#D4AF37]"/> Free 14-Day Returns</span>
                <span className="flex items-center"><Truck size={16} className="mr-2 text-[#D4AF37]"/> Fast Delivery</span>
                <span className="flex items-center"><ShieldCheck size={16} className="mr-2 text-[#D4AF37]"/> 100% Authentic</span>
              </div>

              <div className="space-y-4">
                {enrichedCartItems.map((item: any, index: number) => (
                  <div key={index} className="bg-[#111111] p-5 sm:p-6 rounded-2xl border border-gray-800 flex items-start gap-6 shadow-xl hover:border-[#D4AF37]/40 transition-colors relative group">
                    
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"></div>

                    {/* 🚀 Product Image (100% visible now) */}
                    <Link to={`/product/${item.id}`} className="w-24 h-24 sm:w-32 sm:h-32 bg-[#0a0a0a] rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden relative shadow-inner">
                      {item.image && item.image !== 'No Image' ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <ImageIcon size={32} className="text-gray-700" />
                      )}
                      {item.discountPercent > 0 && (
                        <div className="absolute top-0 left-0 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-br-lg shadow-md uppercase tracking-wider">
                          {item.discountPercent}% OFF
                        </div>
                      )}
                    </Link>
                    
                    {/* Product Info & Controls */}
                    <div className="flex-grow w-full flex flex-col justify-between min-h-[6rem] sm:min-h-[8rem]">
                      
                      {/* Name and Delete Button Row */}
                      <div className="flex justify-between items-start">
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-serif font-bold text-lg sm:text-xl text-white hover:text-[#D4AF37] transition-colors cursor-pointer line-clamp-2 leading-tight pr-8">
                            {item.name}
                          </h3>
                        </Link>
                        {/* 🚀 Delete Button on Top Right */}
                        <button 
                          onClick={() => {
                            safeRemove(item.id, item.size, item.color);
                            toast.success('Item removed from cart.');
                          }}
                          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full z-10"
                          title="Remove Item"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                      
                      <p className="text-xs sm:text-sm text-gray-500 mt-2 font-medium">
                        Color: <span className="text-gray-300">{item.color}</span> <span className="mx-2">|</span> 
                        Size: <span className="text-gray-300">{item.size}</span>
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between mt-auto pt-4 gap-4">
                        
                        {/* Price Details */}
                        <div className="flex flex-col">
                          <div className="flex items-baseline space-x-2">
                            <span className="text-[#D4AF37] font-black text-xl sm:text-2xl">{siteSettings.currency} {item.sellingPrice.toFixed(2)}</span>
                            {item.discountPercent > 0 && (
                              <span className="text-gray-600 line-through text-xs sm:text-sm font-medium">{siteSettings.currency} {item.originalPrice.toFixed(2)}</span>
                            )}
                          </div>
                        </div>

                        {/* 🚀 Quantity Controller & Subtotal Layout Fixed */}
                        <div className="flex flex-col items-end">
                          <div className="flex items-center border border-gray-700 rounded-full bg-[#0a0a0a] p-1 shadow-inner">
                            <button 
                              onClick={() => safeDecrease(item.id, item.size, item.color)} 
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-30"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold w-6 sm:w-8 text-center text-white text-sm sm:text-base">{item.quantity}</span>
                            <button 
                              onClick={() => safeIncrease(item.id, item.size, item.color)} 
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-[#D4AF37]/20 hover:text-[#D4AF37] transition-colors disabled:opacity-30"
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          {/* Subtotal right below the counter */}
                          <div className="text-right mt-2 pr-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mr-2">Subtotal</span>
                            <span className="font-bold text-white tracking-wide text-sm">{siteSettings.currency} {item.itemSubtotal.toFixed(2)}</span>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🚀 Right Side: Premium Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-[#111111] p-6 sm:p-8 rounded-2xl border border-[#D4AF37]/30 sticky top-24 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                
                <h2 className="text-xl font-serif font-bold text-white mb-6 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-6 bg-[#D4AF37] mr-3 rounded-full"></span>
                  Order Summary
                </h2>
                
                <div className="space-y-4 text-sm mb-8 font-medium">
                  <div className="flex justify-between text-gray-400">
                    <span>Original Value ({enrichedCartItems.length} items)</span>
                    <span className="text-white">{siteSettings.currency} {totalOriginalPrice.toFixed(2)}</span>
                  </div>

                  {/* 🚀 Admin Product Discount Display */}
                  {totalProductDiscount > 0 && (
                    <div className="flex justify-between text-[#D4AF37]">
                      <span className="flex items-center"><Tag size={14} className="mr-1"/> Product Discount</span>
                      <span>-{siteSettings.currency} {totalProductDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* 🚀 Amazon Style Delivery Area Selector with Text Fixed */}
                  <div className="border-y border-gray-800 py-5 my-4">
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-4 font-bold flex items-center">
                      <Truck size={14} className="mr-2 text-gray-600"/> Select Delivery Area
                    </p>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${deliveryArea === 'inside' ? 'border-[#D4AF37] bg-[#D4AF37]/20' : 'border-gray-600'}`}>
                          {deliveryArea === 'inside' && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></div>}
                        </div>
                        <input type="radio" name="area" value="inside" className="hidden" checked={deliveryArea === 'inside'} onChange={() => setDeliveryArea('inside')} />
                        <span className="text-gray-300 group-hover:text-white transition-colors">Inside Chattogram ({siteSettings.currency} {shippingInside})</span>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${deliveryArea === 'outside' ? 'border-[#D4AF37] bg-[#D4AF37]/20' : 'border-gray-600'}`}>
                          {deliveryArea === 'outside' && <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]"></div>}
                        </div>
                        <input type="radio" name="area" value="outside" className="hidden" checked={deliveryArea === 'outside'} onChange={() => setDeliveryArea('outside')} />
                        <span className="text-gray-300 group-hover:text-white transition-colors">Outside Chattogram ({siteSettings.currency} {shippingOutside})</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-gray-400">
                    <span>Shipping Fee</span>
                    <span className="text-white">{siteSettings.currency} {shipping.toFixed(2)}</span>
                  </div>

                  {taxRate > 0 && (
                    <div className="flex justify-between text-gray-400">
                      <span>Estimated Tax ({taxRate}%)</span>
                      <span className="text-white">{siteSettings.currency} {taxAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* 🚀 Applied Coupon Display */}
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-green-500 bg-green-500/10 p-4 rounded-xl border border-green-500/20 mt-4">
                      <div className="flex flex-col">
                        <span className="flex items-center font-bold text-xs uppercase tracking-wider">
                          <Ticket size={14} className="mr-1.5"/> Code: {appliedCoupon.code}
                        </span>
                        <button onClick={() => { if(typeof removeCoupon === 'function') removeCoupon(); toast.success('Coupon removed!'); }} className="text-[10px] text-gray-400 hover:text-red-400 hover:underline text-left mt-1.5 uppercase tracking-wider">Remove Coupon</button>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block text-sm">-{siteSettings.currency} {couponDiscountAmount.toFixed(2)}</span>
                        {appliedCoupon.discountType === 'percentage' && (
                          <span className="text-[10px] opacity-70">({appliedCoupon.discountValue}%)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="border-t-2 border-gray-800 pt-5 mb-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                    <span className="font-serif font-bold text-lg text-gray-300 uppercase tracking-widest">Total Amount</span>
                    <span className="font-black text-3xl text-[#D4AF37]">{siteSettings.currency} {grandTotal.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2 sm:text-right">Inclusive of all taxes & fees</p>
                </div>

                {/* Coupon Input */}
                {!appliedCoupon && (
                  <div className="mb-6 relative">
                    <div className="flex items-stretch h-12 rounded-lg overflow-hidden border border-gray-700 focus-within:border-[#D4AF37] transition-colors shadow-inner">
                      <input 
                        type="text" 
                        placeholder="PROMO CODE" 
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-grow bg-[#0a0a0a] px-4 text-white focus:outline-none uppercase tracking-widest text-sm placeholder-gray-600"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        className="bg-gray-800 hover:bg-[#D4AF37] text-white hover:text-black px-6 transition-all duration-300 font-bold uppercase tracking-widest text-xs border-l border-gray-700"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                <button 
                  onClick={() => {
                    localStorage.setItem('mo_selected_delivery_area', deliveryArea);
                    navigate('/checkout');
                  }}
                  className="w-full bg-[#D4AF37] text-black h-14 rounded-lg flex items-center justify-center space-x-3 hover:bg-white transition-all duration-300 font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.5)] transform hover:-translate-y-1"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={20} strokeWidth={3} />
                </button>
                
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}