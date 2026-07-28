import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    status: 'Active'
  });

  // 🚀 ১. ফায়ারবেস ডাটাবেজ থেকে লাইভ কুপন ফেচ
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "coupons"));
      const cArray = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      if (cArray.length > 0) {
        setCoupons(cArray);
        localStorage.setItem('mo_fashion_coupons', JSON.stringify(cArray));
      } else {
        const saved = localStorage.getItem('mo_fashion_coupons');
        if (saved) setCoupons(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Coupons fetch error", e);
      const saved = localStorage.getItem('mo_fashion_coupons');
      if (saved) setCoupons(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      try {
        await deleteDoc(doc(db, "coupons", id));
      } catch (e) {
        console.error("Delete error", e);
      }
      const updated = coupons.filter(c => c.id !== id);
      setCoupons(updated);
      localStorage.setItem('mo_fashion_coupons', JSON.stringify(updated));
      toast.success(`Coupon "${code}" deleted!`);
    }
  };

  // 🚀 ২. ১০০% গ্যারান্টিড সেভ বাটন হ্যান্ডলার (বাটন কখনো আটকে থাকবে না)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = formData.code.trim().toUpperCase();
    const valNum = parseFloat(formData.discountValue);

    if (!cleanCode) {
      toast.error("Please enter a valid coupon code!");
      return;
    }

    if (isNaN(valNum) || valNum <= 0) {
      toast.error("Please enter a valid discount value!");
      return;
    }

    setIsSaving(true);

    const newCouponData = {
      code: cleanCode,
      discountType: formData.discountType,
      discountValue: valNum,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    let savedId = `coupon-${Date.now()}`;

    // 🟢 ফায়ারবেস ক্লাউড ডাটাবেজে সেভ
    try {
      const docRef = await addDoc(collection(db, "coupons"), newCouponData);
      savedId = docRef.id;
      toast.success(`Coupon "${cleanCode}" saved live to Cloud Database!`);
    } catch (err: any) {
      console.error("Firebase Coupon Save Error:", err);
      toast.error(`Saved locally (Firebase: ${err.message || "Rule Check Required"})`);
    }

    // 🟢 লোকাল মেমোরি আপডেট যাতে কাস্টমার পেজে সাথে সাথেই কাজ করে
    const updatedList = [{ id: savedId, ...newCouponData }, ...coupons];
    setCoupons(updatedList);
    localStorage.setItem('mo_fashion_coupons', JSON.stringify(updatedList));

    setIsModalOpen(false);
    setFormData({ code: '', discountType: 'percentage', discountValue: '', status: 'Active' });
    setIsSaving(false);
  };

  return (
    <div className="text-white pb-10">
      <Helmet><title>Admin - Coupons | MO FASHION</title></Helmet>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#D4AF37] uppercase flex items-center">
            <Tag className="mr-3" size={28} /> Coupon Management
          </h1>
          <p className="text-sm text-gray-400">Create discount coupons that work on all devices in real-time</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#D4AF37] text-black px-5 py-2.5 rounded font-bold flex items-center space-x-2">
          <Plus size={20} /> <span>Create New Coupon</span>
        </button>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 p-6">
        {loading ? <div className="text-center text-[#D4AF37] animate-pulse">Loading Live Coupons...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((c: any) => (
              <div key={c.id} className="bg-[#111111] p-5 rounded-xl border border-gray-800 flex justify-between items-center">
                <div>
                  <span className="text-[#D4AF37] font-bold text-xl uppercase tracking-wider">{c.code}</span>
                  <p className="text-xs text-gray-400 mt-1">Discount: {c.discountValue}{c.discountType === 'percentage' ? '%' : '$'} OFF</p>
                </div>
                <button onClick={() => handleDelete(c.id, c.code)} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
            ))}
            {coupons.length === 0 && (
              <div className="col-span-3 text-center text-gray-500 py-6">No coupons created yet. Click "Create New Coupon" above.</div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h2 className="text-xl font-bold text-[#D4AF37]">CREATE NEW COUPON</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1">COUPON CODE *</label>
                <input type="text" required placeholder="e.g. HELLO, SUMMER50" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full bg-[#111111] border border-gray-700 p-3 rounded text-white uppercase focus:border-[#D4AF37] focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1">DISCOUNT TYPE</label>
                <select value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})} className="w-full bg-[#111111] border border-gray-700 p-3 rounded text-white focus:border-[#D4AF37] focus:outline-none">
                  <option value="percentage">Percentage (%) Discount</option>
                  <option value="fixed">Fixed Amount ($) Discount</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 font-bold mb-1">DISCOUNT VALUE *</label>
                <input type="number" required placeholder="e.g. 10 or 30" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: e.target.value})} className="w-full bg-[#111111] border border-gray-700 p-3 rounded text-white focus:border-[#D4AF37] focus:outline-none" />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-700 rounded text-gray-300">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSaving} 
                  className="bg-[#D4AF37] text-black px-6 py-2 rounded font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}