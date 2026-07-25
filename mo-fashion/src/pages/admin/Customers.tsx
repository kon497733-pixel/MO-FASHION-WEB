import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // LocalStorage-এ কাস্টমারের ব্লক এবং ডিলিট স্ট্যাটাস পার্মানেন্টলি সেভ রাখার জন্য
  const [localPrefs, setLocalPrefs] = useState(() => {
    const saved = localStorage.getItem('mo_customer_prefs');
    return saved ? JSON.parse(saved) : { blocked: [], deleted: [] };
  });

  // 🚀 FIX: ডাটাবেস এর বদলে লোকাল স্টোরেজ থেকে সরাসরি কাস্টমার ডাটা আনা হচ্ছে
  useEffect(() => {
    try {
      // CheckoutPage থেকে সেভ হওয়া রিয়েল কাস্টমার ডাটা আনা
      const savedCustomers = JSON.parse(localStorage.getItem('mo_fashion_customers') || '[]');
      
      // ডিলিট হওয়া কাস্টমারদের লিস্ট থেকে বাদ দেওয়া
      const validCustomers = savedCustomers.filter((c: any) => !localPrefs.deleted.includes(c.email));
      
      // ব্লক স্ট্যাটাস চেক করে ডাটা ম্যাপ করা
      const mappedCustomers = validCustomers.map((c: any) => ({
        ...c,
        status: localPrefs.blocked.includes(c.email) ? 'Blocked' : 'Active'
      }));

      setCustomers(mappedCustomers);
    } catch (error) {
      console.error("Failed to load customers:", error);
    }
  }, [localPrefs]);

  // কাস্টমার ব্লক/আনব্লক করার ফাংশন
  const handleToggleStatus = (email: string) => {
    const isBlocked = localPrefs.blocked.includes(email);
    const newBlocked = isBlocked 
      ? localPrefs.blocked.filter((e: string) => e !== email)
      : [...localPrefs.blocked, email];
      
    const newPrefs = { ...localPrefs, blocked: newBlocked };
    setLocalPrefs(newPrefs);
    localStorage.setItem('mo_customer_prefs', JSON.stringify(newPrefs)); // সেভ করে রাখা
    
    if (!isBlocked) {
      toast.error('Customer has been blocked successfully!');
    } else {
      toast.success('Customer has been unblocked successfully!');
    }
  };

  // কাস্টমার ডিলিট করার ফাংশন
  const handleDelete = (email: string) => {
    if (window.confirm("Are you sure you want to delete this customer? They will be removed from this list.")) {
      const newDeleted = [...localPrefs.deleted, email];
      const newPrefs = { ...localPrefs, deleted: newDeleted };
      
      setLocalPrefs(newPrefs);
      localStorage.setItem('mo_customer_prefs', JSON.stringify(newPrefs)); // সেভ করে রাখা
      toast.success("Customer deleted successfully!");
    }
  };

  // সার্চ ফিল্টার
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (customer.name || '').toLowerCase().includes(searchLower) || 
      (customer.email || '').toLowerCase().includes(searchLower) ||
      (customer.phone || '').includes(searchQuery)
    );
  });

  return (
    <div className="text-white pb-10">
      <Helmet>
        <title>Admin - Customers | MO FASHION</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-[#D4AF37] tracking-wider uppercase">Customers Management</h1>
        <p className="text-sm text-gray-400 mt-1">View and manage customers who placed orders</p>
      </div>

      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#D4AF37]/20 mb-6 shadow-md">
        <div className="relative w-full max-w-md">
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-[#D4AF37]/30 rounded-lg px-10 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] placeholder-gray-500 transition-colors"
          />
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#111111] border-b border-[#D4AF37]/20">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-300 uppercase text-sm tracking-wider">Customer Info</th>
                <th className="px-6 py-4 font-medium text-gray-300 uppercase text-sm tracking-wider">Contact</th>
                <th className="px-6 py-4 font-medium text-gray-300 uppercase text-sm tracking-wider text-center">Total Orders</th>
                <th className="px-6 py-4 font-medium text-gray-300 uppercase text-sm tracking-wider">Total Spent</th>
                <th className="px-6 py-4 font-medium text-gray-300 uppercase text-sm tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium text-gray-300 uppercase text-sm tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredCustomers.map((customer: any) => (
                <tr key={customer.id} className="hover:bg-[#111111]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] font-bold uppercase">
                        {customer.name ? customer.name.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{customer.name}</p>
                        <p className="text-xs text-gray-500">First Order: {customer.joinDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-300">
                        <Mail size={14} className="text-[#D4AF37] mr-2" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-300">
                        <Phone size={14} className="text-[#D4AF37] mr-2" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-white text-center">
                    {customer.orders}
                  </td>
                  <td className="px-6 py-4 font-bold text-[#D4AF37]">
                    ৳{Number(customer.spent).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${
                      customer.status === 'Active' 
                      ? 'text-green-400 bg-green-500/10 border-green-500/20' 
                      : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleToggleStatus(customer.email)}
                        className={`p-2 rounded-md transition-colors border ${
                          customer.status === 'Active' 
                          ? 'text-yellow-500 border-transparent hover:border-yellow-500/30 hover:bg-[#111111]' 
                          : 'text-green-400 border-transparent hover:border-green-500/30 hover:bg-[#111111]'
                        }`}
                        title={customer.status === 'Active' ? 'Block Customer' : 'Unblock Customer'}
                      >
                        {customer.status === 'Active' ? <Ban size={18} /> : <CheckCircle size={18} />}
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(customer.email)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-[#111111] border border-gray-800 hover:border-red-500/30 rounded-md"
                        title="Delete Customer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No customers found. When someone places an order, they will automatically appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}