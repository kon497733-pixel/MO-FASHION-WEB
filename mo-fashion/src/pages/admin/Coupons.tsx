import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Ticket, Percent, DollarSign } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

// 🚀 ফায়ারবেস ক্লাউড কানেকশন ইমপোর্ট
import { db } from '../../firebase/config';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';

export default function Coupons() {
  const [coupons, setCoupons] = useState<any[]>(() => {
    const savedCoupons = localStorage.getItem('mo_fashion_coupons');
    return savedCoupons ? JSON.parse(savedCoupons) : [];
  });
  const [loading, setLoading] = useState(true);

  // 🚀 ১. ফায়ারবেস ক্লাউড ডাটাবেস থেকে রিয়েল-টাইম কুপন সিঙ্ক
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'coupons'));
        const cloudCoupons: any[] = [];
        querySnapshot.forEach((docSnap) => {
          cloudCoupons.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (cloudCoupons.length > 0) {
          setCoupons(cloudCoupons);
          localStorage.setItem('mo_fashion_coupons', JSON.stringify(cloudCoupons));
        }
      } catch (error) {
        console.warn("Firestore Cloud Fetch Skipped.");
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    discount: '',
    discountType: 'percentage',
    expiry: '',
    status: 'Active',
    usageLimit: 0,
    used: 0
  });

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ id: '', code: '', discount: '', discountType: 'percentage', expiry: '', status: 'Active', usageLimit: 100, used: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: any) => {
    setModalMode('edit');
    const isPercentage = String(coupon.discount).includes('%');
    const cleanDiscount = String(coupon.discount).replace(/[^0-9.]/g, '');
    
    setFormData({
      ...coupon,
      discount: cleanDiscount,
      discountType: coupon.discountType || (isPercentage ? 'percentage' : 'fixed')
    });
    setIsModalOpen(true);
  };

  // 🚀 ২. সুপার ফাস্ট ডিলিট লজিক (০.১ সেকেন্ডে মুছে যাবে)
  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete coupon "${code}"?`)) {
      // লোকালি সাথে সাথে মুছে ফেলা
      const updated = coupons.filter((c: any) => c.id !== id);
      setCoupons(updated);
      localStorage.setItem('mo_fashion_coupons', JSON.stringify(updated));
      toast.success("Coupon deleted permanently!");

      // ব্যাকগ্রাউন্ডে ক্লাউড থেকে মোছা
      try {
        await deleteDoc(doc(db, "coupons", id));
      } catch (error) {
        console.warn("Cloud delete failed.");
      }
    }
  };

  // 🚀 ৩. সুপার ফাস্ট ইনস্ট্যান্ট সেভ লজিক (০.১ সেকেন্ডে সেভ হয়ে যাবে)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.discount || !formData.expiry) {
      toast.error("Please fill all required fields!");
      return;
    }

    const formattedDiscountValue = formData.discountType === 'percentage' 
      ? `${formData.discount}%` 
      : `৳${formData.discount}`;

    const formattedData = { 
      code: formData.code.toUpperCase().trim(),
      discount: formattedDiscountValue,
      discountValue: Number(formData.discount),
      discountType: formData.discountType,
      expiry: formData.expiry,
      status: formData.status,
      usageLimit: Number(formData.usageLimit) || 1,
      used: Number(formData.used) || 0,
      updatedAt: new Date().toISOString()
    };

    const targetId = formData.id || Date.now().toString();
    const localCouponObj = { id: targetId, ...formattedData };

    // ১. লোকাল মেমোরিতে ইনস্ট্যান্ট সেভ করা (কোনো লোডিং আটকে থাকবে না)
    let updatedList = [];
    if (modalMode === 'add') {
      updatedList = [localCouponObj, ...coupons];
    } else {
      updatedList = coupons.map((c: any) => c.id === targetId ? localCouponObj : c);
    }

    setCoupons(updatedList);
    localStorage.setItem('mo_fashion_coupons', JSON.stringify(updatedList));
    
    // ইনস্ট্যান্ট পপ-আপ ফর্ম বন্ধ করা ও সাকসেস টোস্ট দেখানো
    setIsModalOpen(false);
    toast.success(modalMode === 'add' ? 'New coupon created successfully!' : 'Coupon updated successfully!');

    // ২. ব্যাকগ্রাউন্ডে ক্লাউড ডাটাবেজে সেভ করা (সর্বোচ্চ ২ সেকেন্ড ওয়েট করবে, আটকে থাকবে না)
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cloud timeout')), 2000)
      );

      if (modalMode === 'add') {
        await Promise.race([
          addDoc(collection(db, "coupons"), formattedData),
          timeoutPromise
        ]);
      } else {
        const couponRef = doc(db, "coupons", String(targetId));
        await Promise.race([
          setDoc(couponRef, formattedData, { merge: true }),
          timeoutPromise
        ]);
      }
    } catch (error) {
      console.warn("Background Cloud Sync completed or skipped.");
    }
  };

  const filteredCoupons = coupons.filter((coupon: any) => 
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-white pb-10">
      <Helmet>
        <title>Admin - Coupons | MO FASHION</title>
      </Helmet>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#D4AF37] tracking-wider uppercase">Coupons Management</h1>
          <p className="text-sm text-gray-400 mt-1">Create and manage live discount codes for your customers</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-[#D4AF37] text-black px-5 py-2.5 rounded hover:bg-white transition-colors font-bold flex items-center space-x-2 shadow-lg"
        >
          <Plus size={20} />
          <span>Add New Coupon</span>
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#D4AF37]/20 mb-6 shadow-lg">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Search coupons by code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#D4AF37]/30 rounded-lg px-10 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] placeholder-gray-500 transition-colors"
          />
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto custom-scrollbar">
          {loading ? (
             <div className="text-center py-10 text-[#D4AF37] animate-pulse">Syncing Cloud Database...</div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#111111] border-b border-[#D4AF37]/20">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Coupon Code</th>
                  <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Discount</th>
                  <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Usage</th>
                  <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredCoupons.map((coupon: any) => (
                  <tr key={coupon.id} className="hover:bg-[#111111]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3 text-[#D4AF37] font-bold tracking-wider">
                        <Ticket size={18} className="text-gray-500" />
                        <span>{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      <span className={`px-2 py-1 rounded text-xs ${coupon.discountType === 'percentage' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `৳${coupon.discountValue} OFF`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">
                        <span className={coupon.used >= coupon.usageLimit ? 'text-red-500' : 'text-white'}>{coupon.used}</span>
                        <span className="text-gray-500"> / {coupon.usageLimit}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-[#111111] rounded-full mt-2 overflow-hidden border border-gray-800">
                        <div 
                          className={`h-full ${coupon.used >= coupon.usageLimit ? 'bg-red-500' : 'bg-[#D4AF37]'}`}
                          style={{ width: `${Math.min((coupon.used / coupon.usageLimit) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{coupon.expiry}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${
                        coupon.status === 'Active' 
                        ? 'text-green-400 bg-green-500/10 border-green-500/20' 
                        : 'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}>
                        {coupon.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          onClick={() => handleOpenEdit(coupon)}
                          className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors bg-[#111111] border border-gray-800 hover:border-[#D4AF37]/50 rounded-md"
                          title="Edit Coupon"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-[#111111] border border-gray-800 hover:border-red-500/50 rounded-md"
                          title="Delete Coupon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCoupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No coupons found. Click "Add New Coupon" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20 bg-[#111111]">
              <h2 className="text-xl font-serif font-bold text-[#D4AF37] uppercase flex items-center">
                <Ticket className="mr-2" size={24} />
                {modalMode === 'add' ? 'Create New Coupon' : 'Edit Coupon'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Coupon Code *</label>
                <input 
                  type="text" 
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors uppercase tracking-wider"
                  placeholder="e.g. SUMMER50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Discount Type</label>
                  <select 
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Discount Value *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {formData.discountType === 'percentage' ? (
                        <Percent size={16} className="text-gray-500" />
                      ) : (
                        <DollarSign size={16} className="text-gray-500" />
                      )}
                    </div>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: e.target.value})}
                      className="w-full bg-[#111111] border border-gray-700 rounded-lg pl-9 pr-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                      placeholder={formData.discountType === 'percentage' ? "e.g. 10" : "e.g. 500"}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Usage Limit *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: parseInt(e.target.value) || 1})}
                    className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    placeholder="e.g. 100"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Expiry Date *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.expiry}
                    onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                    className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              <div className="pt-6 border-t border-[#D4AF37]/10 flex justify-end space-x-4 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-[#111111] hover:text-white transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="bg-[#D4AF37] text-black px-8 py-2.5 rounded-lg hover:bg-white transition-colors font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] disabled:opacity-50"
                >
                  {modalMode === 'add' ? 'Save Coupon' : 'Update Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}