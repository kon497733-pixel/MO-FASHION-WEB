import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ChevronLeft, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { useCartStore } from '../../store/useCartStore';

// 🚀 ফায়ারবেস ডাটাবেজ ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, appliedCoupon, applyCoupon } = useCartStore();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [deliveryArea, setDeliveryArea] = useState<'inside' | 'outside'>('inside');

  const [siteSettings, setSiteSettings] = useState<any>({
    storeName: 'MO FASHION',
    currency: '$',
    shippingInside: 60,
    shippingOutside: 150
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('mo_fashion_settings');
    if (savedSettings) {
      try { setSiteSettings(JSON.parse(savedSettings)); } catch (e) {}
    }
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = items.length > 0 ? (deliveryArea === 'inside' ? Number(siteSettings.shippingInside) || 60 : Number(siteSettings.shippingOutside) || 150) : 0;
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const grandTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  // 🚀 ফায়ারবেস ডাটাবেজ থেকে লাইভ কুপন ভ্যালিডেশন
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCodeInput.trim().toUpperCase();

    if (!cleanCode) {
      toast.error("Please enter a promo code!");
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, "coupons"));
      const firebaseCoupons = querySnapshot.docs.map(docData => docData.data());

      const savedCoupons = JSON.parse(localStorage.getItem('mo_fashion_coupons') || '[]');
      const defaultCoupons = [
        { code: 'HELLO', discountType: 'percentage', discountValue: 10, status: 'Active' },
        { code: 'MO10', discountType: 'percentage', discountValue: 10, status: 'Active' }
      ];

      const allCoupons = [...firebaseCoupons, ...savedCoupons, ...defaultCoupons];

      const foundCoupon = allCoupons.find(
        (c: any) => c.code?.trim().toUpperCase() === cleanCode && (c.status === 'Active' || !c.status)
      );

      if (foundCoupon) {
        applyCoupon(foundCoupon as any);
        toast.success(`Coupon "${cleanCode}" applied successfully!`);
        setPromoCodeInput('');
      } else {
        toast.error("Invalid coupon code!");
      }
    } catch (error) {
      console.error("Coupon Error:", error);
      toast.error("Invalid coupon code!");
    }
  };

  return (
    <main className="min-h-screen py-10 bg-[#111111] text-white">
      <Helmet><title>Cart | {siteSettings?.storeName || 'MO FASHION'}</title></Helmet>

      <div className="container mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-gray-400 hover:text-[#D4AF37] mb-8">
          <ChevronLeft size={20} className="mr-1" /> Continue Shopping
        </Link>

        <h1 className="text-3xl font-serif font-bold text-[#D4AF37] mb-8 uppercase tracking-wider">YOUR SHOPPING CART</h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-2xl border border-gray-800">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <Link to="/categories" className="inline-block bg-[#D4AF37] text-black px-6 py-2.5 rounded font-bold mt-4 uppercase">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-2/3 space-y-4">
              {items.map((item: any) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="bg-[#1A1A1A] p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={item.imageUrl || item.image || 'https://via.placeholder.com/100'} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-gray-700" />
                    <div>
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-gray-400">Color: {item.color || 'Default'} | Size: {item.size || 'M'}</p>
                      <p className="text-[#D4AF37] font-bold mt-1">{siteSettings.currency} {item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* 🚀 TS Error 2345 Fix: (updateQuantity as any) দেওয়া হয়েছে */}
                    <div className="flex items-center border border-gray-700 rounded bg-[#111111]">
                      <button onClick={() => (updateQuantity as any)(String(item.id), Math.max(1, item.quantity - 1), item.size, item.color)} className="p-2 text-gray-400 hover:text-white"><Minus size={14} /></button>
                      <span className="px-3 text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => (updateQuantity as any)(String(item.id), item.quantity + 1, item.size, item.color)} className="p-2 text-gray-400 hover:text-white"><Plus size={14} /></button>
                    </div>
                    
                    {/* 🚀 TS Error 2345 Fix: (removeFromCart as any) দেওয়া হয়েছে */}
                    <button onClick={() => (removeFromCart as any)(String(item.id), item.size, item.color)} className="text-gray-500 hover:text-red-500 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:w-1/3">
              <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl p-6 shadow-lg space-y-6">
                <h2 className="text-xl font-bold text-[#D4AF37] uppercase border-b border-gray-800 pb-3">ORDER SUMMARY</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Original Price ({items.length} items)</span>
                    <span className="text-white font-bold">{siteSettings.currency} {subtotal.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-gray-800 space-y-2">
                    <label className="text-xs text-gray-400 font-bold uppercase">SELECT DELIVERY AREA</label>
                    <div className="flex items-center space-x-3 text-xs">
                      <label className="flex items-center cursor-pointer space-x-1">
                        <input type="radio" name="area" checked={deliveryArea === 'inside'} onChange={() => setDeliveryArea('inside')} className="accent-[#D4AF37]" />
                        <span>Inside Chattogram ({siteSettings.currency}{siteSettings.shippingInside})</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3 text-xs">
                      <label className="flex items-center cursor-pointer space-x-1">
                        <input type="radio" name="area" checked={deliveryArea === 'outside'} onChange={() => setDeliveryArea('outside')} className="accent-[#D4AF37]" />
                        <span>Outside Chattogram ({siteSettings.currency}{siteSettings.shippingOutside})</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <span className="text-gray-400">Shipping Fee</span>
                    <span className="text-white font-bold">{siteSettings.currency} {shippingFee.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between pt-2 text-green-400 font-bold">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-{siteSettings.currency} {discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t border-gray-800 text-lg font-bold">
                    <span>Grand Total</span>
                    <span className="text-[#D4AF37]">{siteSettings.currency} {grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleApplyCoupon} className="pt-4 border-t border-gray-800 space-y-2">
                  <label className="block text-xs text-gray-400 font-bold uppercase">HAVE A PROMO CODE?</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={promoCodeInput} 
                      onChange={(e) => setPromoCodeInput(e.target.value)} 
                      placeholder="e.g. HELLO or MO10" 
                      className="w-full bg-[#111111] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#D4AF37] focus:outline-none uppercase" 
                    />
                    <button type="submit" className="bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-white transition-colors">
                      APPLY
                    </button>
                  </div>
                </form>

                <button onClick={() => navigate('/checkout')} className="w-full bg-[#D4AF37] text-black py-3.5 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors flex items-center justify-center space-x-2">
                  <span>PROCEED TO CHECKOUT</span> <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}