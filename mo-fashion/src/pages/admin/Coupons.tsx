import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Ticket, Copy, RefreshCw } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function Coupons() {
  // 🚀 ডাটাবেস (Local Storage) থেকে কুপন ডাটা লোড করা
  const [coupons, setCoupons] = useState<any[]>(() => {
    const savedCoupons = localStorage.getItem('mo_fashion_coupons');
    if (savedCoupons) {
      return JSON.parse(savedCoupons);
    }
    // ডিফল্ট কিছু ডেমো কুপন (যদি আগে থেকে না থাকে)
    return [
      { id: 1, code: 'WELCOME20', discountValue: 20, type: 'percentage', usageLimit: 500, used: 145, expiryDate: '2026-12-31', status: 'Active' },
      { id: 2, code: 'FLAT500', discountValue: 500, type: 'fixed', usageLimit: 100, used: 100, expiryDate: '2026-08-15', status: 'Expired' },
    ];
  });

  // কুপনগুলোতে কোনো পরিবর্তন হলে তা সাথে সাথে সেভ করা
  useEffect(() => {
    localStorage.setItem('mo_fashion_coupons', JSON.stringify(coupons));
  }, [coupons]);

  // স্টেটস
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    discountValue: '',
    type: 'percentage',
    usageLimit: '',
    used: 0,
    expiryDate: '',
    status: 'Active'
  });

  // 🚀 অটোমেটিক সিকিউর কুপন কোড জেনারেটর
  const generateRandomCode = () => {
    const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, code: `MO-${randomString}` });
  };

  // 모ডাল ওপেন করা (নতুন কুপন অ্যাড করার জন্য)
  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ 
      id: Date.now(), 
      code: '', 
      discountValue: '', 
      type: 'percentage', 
      usageLimit: '', 
      used: 0, 
      expiryDate: '', 
      status: 'Active' 
    });
    setIsModalOpen(true);
  };

  // 모ডাল ওপেন করা (পুরোনো কুপন এডিট করার জন্য)
  const handleOpenEdit = (coupon: any) => {
    setModalMode('edit');
    setFormData(coupon);
    setIsModalOpen(true);
  };

  // কুপন ডিলিট করার লজিক
  const handleDelete = (id: number, code: string) => {
    if (window.confirm(`Are you sure you want to delete the coupon "${code}"?`)) {
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success(`Coupon ${code} deleted successfully!`);
    }
  };

  // এক ক্লিকে কুপন কোড কপি করা
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
  };

  // কুপন সেভ বা আপডেট করার মেইন লজিক
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.discountValue || !formData.usageLimit || !formData.expiryDate) {
      toast.error("Please fill in all required fields!");
      return;
    }

    const finalCode = formData.code.trim().toUpperCase();

    // 🚀 ডুপ্লিকেট কুপন কোড চেক করা (একই কোড দুবার দেওয়া যাবে না)
    if (modalMode === 'add') {
      const isDuplicate = coupons.some(c => c.code === finalCode);
      if (isDuplicate) {
        toast.error(`Coupon code "${finalCode}" already exists!`);
        return;
      }
    }

    const newCoupon = {
      ...formData,
      code: finalCode,
      discountValue: Number(formData.discountValue),
      usageLimit: Number(formData.usageLimit),
    };

    if (modalMode === 'add') {
      setCoupons([newCoupon, ...coupons]);
      toast.success("New coupon created and activated!");
    } else {
      setCoupons(coupons.map(c => c.id === formData.id ? newCoupon : c));
      toast.success("Coupon details updated successfully!");
    }
    
    setIsModalOpen(false);
  };

  // সার্চ ফিল্টার লজিক
  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="text-white pb-10">
      <Helmet>
        <title>Admin - Coupons Management | MO FASHION</title>
      </Helmet>

      {/* 🚀 Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#D4AF37] tracking-wider uppercase">Coupons Management</h1>
          <p className="text-sm text-gray-400 mt-1">Create, track, and manage promotional discount codes</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-[#D4AF37] text-black px-6 py-2.5 rounded-lg hover:bg-white transition-colors font-bold flex items-center space-x-2 shadow-[0_0_15px_rgba(212,175,55,0.3)] w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* 🚀 Search Section */}
      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#D4AF37]/20 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Search coupons by code..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-gray-700 rounded-lg px-10 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] placeholder-gray-500 transition-colors uppercase"
          />
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        </div>
      </div>

      {/* 🚀 Coupons Table (Fully Responsive) */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#111111] border-b border-[#D4AF37]/20">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Coupon Code</th>
                <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Discount</th>
                <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Usage & Limit</th>
                <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold text-gray-300 uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCoupons.map((coupon) => {
                // 🚀 প্রোগ্রেস বার লজিক (Usage Tracking)
                const usagePercent = coupon.usageLimit > 0 ? (coupon.used / coupon.usageLimit) * 100 : 0;
                const isNearingLimit = usagePercent > 80;

                return (
                  <tr key={coupon.id} className="hover:bg-[#111111]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                          <Ticket size={18} />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white tracking-widest text-lg">{coupon.code}</span>
                          <button 
                            onClick={() => handleCopyCode(coupon.code)}
                            className="text-gray-500 hover:text-[#D4AF37] transition-colors p-1"
                            title="Copy Code"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#D4AF37] text-lg">
                        {coupon.type === 'percentage' ? `${coupon.discountValue}% OFF` : `৳${coupon.discountValue} OFF`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white font-medium">{coupon.used} Used</span>
                          <span className="text-gray-500">of {coupon.usageLimit}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${isNearingLimit ? 'bg-red-500' : 'bg-[#D4AF37]'}`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 font-medium">{new Date(coupon.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border inline-block ${
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
                          className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors bg-[#111111] rounded-md border border-gray-800 hover:border-[#D4AF37]/50"
                          title="Edit Coupon"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-[#111111] rounded-md border border-gray-800 hover:border-red-500/50"
                          title="Delete Coupon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCoupons.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Ticket size={48} className="mx-auto mb-4 opacity-20 text-[#D4AF37]" />
                    <p className="text-lg font-medium text-white mb-2">No coupons found!</p>
                    <p className="text-sm">Click "Create New Coupon" to generate promotional codes.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚀 Add/Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20 bg-[#111111]">
              <h2 className="text-xl font-serif font-bold text-[#D4AF37] uppercase flex items-center">
                <Ticket className="mr-2" size={20} />
                {modalMode === 'add' ? 'Create New Coupon' : 'Edit Coupon Settings'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form id="couponForm" onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              
              {/* Coupon Code & Generator */}
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-bold uppercase tracking-wider">Coupon Code *</label>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors uppercase tracking-widest font-bold text-lg"
                    placeholder="e.g. MO-WINTER50"
                  />
                  {modalMode === 'add' && (
                    <button 
                      type="button"
                      onClick={generateRandomCode}
                      className="bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 px-4 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-colors flex items-center justify-center shrink-0"
                      title="Generate Random Code"
                    >
                      <RefreshCw size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Discount Type */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Discount Type *</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'percentage' | 'fixed'})}
                    className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                
                {/* Discount Value */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">
                    Discount Value {formData.type === 'percentage' ? '(%)' : '(৳)'} *
                  </label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    max={formData.type === 'percentage' ? 99 : 99999}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors font-bold"
                    placeholder={formData.type === 'percentage' ? "e.g. 20" : "e.g. 500"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Usage Limit */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Total Usage Limit *</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    placeholder="How many times can it be used?"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Expiry Date *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Coupon Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer font-bold"
                >
                  <option value="Active" className="text-green-500">🟢 Active</option>
                  <option value="Disabled" className="text-yellow-500">🟡 Disabled</option>
                  <option value="Expired" className="text-red-500">🔴 Expired</option>
                </select>
              </div>

            </form>

            <div className="p-6 border-t border-gray-800 flex justify-end space-x-4 bg-[#111111]">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-[#1A1A1A] hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                form="couponForm"
                type="submit"
                className="bg-[#D4AF37] text-black px-8 py-2.5 rounded-lg hover:bg-white transition-colors font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)] uppercase tracking-wider"
              >
                {modalMode === 'add' ? 'Save Coupon' : 'Update Coupon'}
              </button>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
}