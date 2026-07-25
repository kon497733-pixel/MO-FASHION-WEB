import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Smartphone, Banknote, Tag, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { useCartStore } from '../../store/useCartStore';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, appliedCoupon, clearCart } = useCartStore();

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [siteSettings, setSiteSettings] = useState<any>({
    storeName: 'MO FASHION',
    phoneNumber: '+8801707697445', // 🚀 আপনার ওয়াটসঅ্যাপ নম্বর
    currency: '৳',
    taxRate: 0,
    shippingInside: 60,
    shippingOutside: 150,
    enableBkash: true,
    enableCard: true,
    enableCOD: true
  });

  useEffect(() => {
    const savedProducts = localStorage.getItem('mo_fashion_products');
    if (savedProducts) {
      setDbProducts(JSON.parse(savedProducts));
    }
    
    const savedSettings = localStorage.getItem('mo_fashion_settings');
    if (savedSettings) {
      setSiteSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    if (!paymentMethod) {
      if (siteSettings.enableBkash) setPaymentMethod('bKash');
      else if (siteSettings.enableCard) setPaymentMethod('Card');
      else if (siteSettings.enableCOD) setPaymentMethod('Cash on Delivery');
    }
  }, [siteSettings, paymentMethod]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Bangladesh' 
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'This box is currently empty and must be filled.';
    if (!formData.email.trim()) {
      newErrors.email = 'This box is currently empty and must be filled.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'This box is currently empty and must be filled.';
    } else if (cleanPhone.length !== 11) {
      newErrors.phone = 'This number is incorrect. Must be exactly 11 digits (e.g. 017XXXXXXXX).';
    }

    if (!formData.address.trim()) newErrors.address = 'This box is currently empty and must be filled.';
    if (!formData.city.trim()) newErrors.city = 'This box is currently empty and must be filled.';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'This box is currently empty and must be filled.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  let subtotalAfterProductDiscount = 0;

  const enrichedCartItems = items.map((cartItem: any) => {
    const dbProduct = dbProducts.find(p => String(p._id || p.id) === String(cartItem.id));
    const originalPrice = dbProduct ? Number(dbProduct.price) : Number(cartItem.price);
    const discountPercent = dbProduct ? Number(dbProduct.discount) || 0 : 0;
    const sellingPrice = originalPrice - (originalPrice * discountPercent) / 100;
    subtotalAfterProductDiscount += sellingPrice * cartItem.quantity;

    let productImage = '';
    if (dbProduct) {
       if (dbProduct.images && dbProduct.images.length > 0 && !dbProduct.images[0].includes('No+Image')) {
           productImage = dbProduct.images[0];
       } else if (dbProduct.imageUrl) {
           productImage = dbProduct.imageUrl;
       }
    }
    if (!productImage) productImage = cartItem.image || cartItem.imageUrl || '';

    return { ...cartItem, displayImage: productImage };
  });

  const isInsideChattogram = formData.city.toLowerCase().includes('chattogram') || formData.city.toLowerCase().includes('chittagong');
  const shipping = enrichedCartItems.length > 0 ? (isInsideChattogram ? (Number(siteSettings.shippingInside) || 60) : (Number(siteSettings.shippingOutside) || 150)) : 0;
  const totalAmount = Math.max(0, subtotalAfterProductDiscount + shipping);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // 🚀 হোয়াটসঅ্যাপে মেসেজ পাঠানোর ফাংশন
  const sendWhatsAppOrder = (orderId: string, customerName: string) => {
    const adminPhone = "8801707697445"; // আপনার হোয়াটসঅ্যাপ নাম্বার
    
    let productDetailsText = enrichedCartItems.map((item, index) => 
      `${index + 1}. *${item.name}* (Qty: ${item.quantity}, Size: ${item.size || 'M'}) - ${siteSettings?.currency || '৳'}${item.price * item.quantity}`
    ).join('%0A');

    const message = `🛍️ *NEW ORDER PLACED on ${siteSettings?.storeName || 'MO FASHION'}*%0A%0A` +
      `🆔 *Order ID:* ${orderId}%0A` +
      `👤 *Customer Name:* ${customerName}%0A` +
      `📞 *Phone:* ${formData.phone}%0A` +
      `📧 *Email:* ${formData.email}%0A` +
      `📍 *Address:* ${formData.address}, ${formData.city} - ${formData.postalCode}%0A` +
      `💳 *Payment Method:* ${paymentMethod}%0A%0A` +
      `📦 *Ordered Items:*%0A${productDetailsText}%0A%0A` +
      `🚚 *Shipping Charge:* ${siteSettings?.currency || '৳'}${shipping}%0A` +
      `💰 *Grand Total:* *${siteSettings?.currency || '৳'}${totalAmount.toFixed(2)}*`;

    const whatsappUrl = `https://wa.me/${adminPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    if (enrichedCartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    setIsSubmitting(true);

    const orderId = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const customerName = `${formData.firstName} ${formData.lastName}`.trim();

    const newOrder = {
      id: orderId,
      _id: orderId,
      customer: customerName,
      customerInfo: formData,
      email: formData.email,
      phone: formData.phone,
      address: `${formData.address}, ${formData.city} - ${formData.postalCode}`,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      total: totalAmount,
      status: 'Pending',
      paymentMethod: paymentMethod,
      orderItems: enrichedCartItems
    };

    try {
      // 🟢 ১. ডাটাবেজ/লোকালস্টোরেজে অর্ডার সেভ
      const existingOrders = JSON.parse(localStorage.getItem('mo_fashion_orders') || '[]');
      localStorage.setItem('mo_fashion_orders', JSON.stringify([newOrder, ...existingOrders]));

      // 🟢 ২. স্টক বিয়োগ করা
      const savedProducts = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');
      if (savedProducts.length > 0) {
        const updatedProducts = savedProducts.map((p: any) => {
          const orderedItem = enrichedCartItems.find((item: any) => String(item.id) === String(p._id || p.id));
          if (orderedItem) {
            const currentStock = Number(p.stock !== undefined ? p.stock : 100);
            const newStock = Math.max(0, currentStock - Number(orderedItem.quantity || 1));
            return {
              ...p,
              stock: newStock,
              status: newStock <= 0 ? 'Out of Stock' : 'Active'
            };
          }
          return p;
        });
        localStorage.setItem('mo_fashion_products', JSON.stringify(updatedProducts));
      }

      // 🟢 ৩. সাথে সাথে হোয়াটসঅ্যাপে নোটিফিকেশন পাঠানো
      sendWhatsAppOrder(orderId, customerName);

      clearCart();
      toast.success(`Order ${orderId} placed & sent to WhatsApp!`);
      setTimeout(() => navigate('/'), 2000);

    } catch (error) {
      toast.error("Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen py-10 text-white bg-[#111111]">
      <Helmet><title>Checkout | {siteSettings?.storeName || 'MO FASHION'}</title></Helmet>
      <div className="container mx-auto px-4">
        <Link to="/cart" className="inline-flex items-center text-gray-400 hover:text-[#D4AF37] mb-8">
          <ChevronLeft size={20} className="mr-1" /> Back to Cart
        </Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#D4AF37] mb-8 uppercase">CHECKOUT</h1>

        <div className="flex flex-col lg:flex-row gap-10">
          <div className="lg:w-2/3 space-y-8">
            <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-6 uppercase border-b border-[#D4AF37]/10 pb-3">Shipping Details</h2>

              <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">First Name *</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`w-full bg-[#111111] border rounded-md px-4 py-2.5 text-white ${errors.firstName ? 'border-red-500' : 'border-gray-700'}`} placeholder="e.g. Mehedi" />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-[#111111] border border-gray-700 rounded-md px-4 py-2.5 text-white" placeholder="e.g. Hasan" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Email Address *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full bg-[#111111] border rounded-md px-4 py-2.5 text-white ${errors.email ? 'border-red-500' : 'border-gray-700'}`} placeholder="e.g. mail@example.com" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Phone Number *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`w-full bg-[#111111] border rounded-md px-4 py-2.5 text-white ${errors.phone ? 'border-red-500' : 'border-gray-700'}`} placeholder="e.g. 01712345678" />
                    {errors.phone && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Full Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} className={`w-full bg-[#111111] border rounded-md px-4 py-2.5 text-white ${errors.address ? 'border-red-500' : 'border-gray-700'}`} placeholder="House/Road/Area" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">City *</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} className={`w-full bg-[#111111] border rounded-md px-4 py-2.5 text-white ${errors.city ? 'border-red-500' : 'border-gray-700'}`} placeholder="e.g. Chattogram" />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Postal Code *</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className={`w-full bg-[#111111] border rounded-md px-4 py-2.5 text-white ${errors.postalCode ? 'border-red-500' : 'border-gray-700'}`} placeholder="e.g. 4000" />
                    {errors.postalCode && <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>}
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Country</label>
                    <input type="text" value="Bangladesh" readOnly className="w-full bg-[#1A1A1A] border border-gray-700 text-gray-400 rounded-md px-4 py-2.5 cursor-not-allowed" />
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-6 uppercase border-b border-[#D4AF37]/10 pb-3">Payment Method</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button type="button" onClick={() => setPaymentMethod('Cash on Delivery')} className="flex flex-col items-center justify-center p-4 rounded-lg border border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]">
                  <Banknote size={32} className="mb-2" />
                  <span className="font-medium">Cash on Delivery</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:w-1/3">
            <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl p-6 shadow-lg sticky top-24">
              <h2 className="text-xl font-serif font-bold text-[#D4AF37] mb-6 uppercase border-b border-[#D4AF37]/10 pb-3">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {enrichedCartItems.map((item: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3 text-sm border-b border-gray-800 pb-3">
                    <span className="text-gray-200 flex-1 font-medium">{item.name} (x{item.quantity})</span>
                    <span className="text-[#D4AF37] font-bold">{siteSettings?.currency} {(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#D4AF37]/30 pt-5 mb-8 flex justify-between items-end">
                <span className="font-bold text-lg text-white">Grand Total</span>
                <span className="font-bold text-3xl text-[#D4AF37]">{siteSettings?.currency} {totalAmount.toFixed(2)}</span>
              </div>
              <button type="submit" form="checkout-form" disabled={isSubmitting} className="w-full bg-[#D4AF37] text-black py-4 rounded-lg font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors shadow-lg">
                {isSubmitting ? 'Processing...' : 'Place Order & Send WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}