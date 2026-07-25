import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, ArrowUpRight, PlusCircle, Tag, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0
  });

  // Local Storage থেকে রিয়েল ডাটা ক্যালকুলেট করা
  useEffect(() => {
    const ordersData = JSON.parse(localStorage.getItem('mo_fashion_orders') || '[]');
    const customersData = JSON.parse(localStorage.getItem('mo_fashion_customers') || '[]');
    const productsData = JSON.parse(localStorage.getItem('mo_fashion_products') || '[]');

    // টোটাল রেভিনিউ হিসাব করা (ক্যানসেল হওয়া অর্ডার বাদে)
    const totalRevenue = ordersData.reduce((sum: number, order: any) => {
      return order.status !== 'Cancelled' ? sum + parseFloat(order.total) : sum;
    }, 0);

    setStats({
      revenue: totalRevenue,
      orders: ordersData.length,
      customers: customersData.length,
      products: productsData.length || 5 // ডিফল্ট ৫টি যেহেতু ডামি আছে
    });
  }, []);

  return (
    <div className="text-white pb-10">
      <Helmet>
        <title>Admin - Dashboard | MO FASHION</title>
      </Helmet>

      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#D4AF37] tracking-wider uppercase">Dashboard Overview</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back, Admin! Here is your store's performance at a glance.</p>
        </div>
        <button className="bg-[#D4AF37]/10 border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-lg font-bold hover:bg-[#D4AF37] hover:text-black transition-colors flex items-center shadow-[0_0_10px_rgba(212,175,55,0.1)]">
          <TrendingUp size={18} className="mr-2" />
          Download Report
        </button>
      </div>

      {/* Top Stats Cards (Premium UI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        {/* Revenue Card */}
        <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center border border-[#D4AF37]/30">
              <DollarSign size={24} className="text-[#D4AF37]" />
            </div>
            <span className="flex items-center text-green-500 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <ArrowUpRight size={14} className="mr-1" /> +12.5%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wide">Total Revenue</h3>
          <p className="text-3xl font-bold text-white">${stats.revenue.toFixed(2)}</p>
        </div>

        {/* Orders Card */}
        <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center border border-[#D4AF37]/30">
              <ShoppingBag size={24} className="text-[#D4AF37]" />
            </div>
            <span className="flex items-center text-green-500 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <ArrowUpRight size={14} className="mr-1" /> +8.2%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wide">Total Orders</h3>
          <p className="text-3xl font-bold text-white">{stats.orders}</p>
        </div>

        {/* Customers Card */}
        <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center border border-[#D4AF37]/30">
              <Users size={24} className="text-[#D4AF37]" />
            </div>
            <span className="flex items-center text-green-500 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <ArrowUpRight size={14} className="mr-1" /> +5.4%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wide">Active Customers</h3>
          <p className="text-3xl font-bold text-white">{stats.customers}</p>
        </div>

        {/* Products Card */}
        <div className="bg-[#1A1A1A] border border-[#D4AF37]/20 p-6 rounded-2xl shadow-lg relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#D4AF37]/5 rounded-full blur-2xl group-hover:bg-[#D4AF37]/10 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center border border-[#D4AF37]/30">
              <Package size={24} className="text-[#D4AF37]" />
            </div>
            <span className="flex items-center text-green-500 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <ArrowUpRight size={14} className="mr-1" /> +2.1%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1 uppercase tracking-wide">Total Products</h3>
          <p className="text-3xl font-bold text-white">{stats.products}</p>
        </div>

      </div>

      {/* Middle Section: Business Insights & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Overview (Mock Chart UI) */}
        <div className="lg:col-span-2 bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Activity className="text-[#D4AF37] mr-2" size={20} />
              Store Performance
            </h2>
            <select className="bg-[#111111] border border-gray-700 text-sm text-gray-400 rounded-lg px-3 py-1 focus:outline-none">
              <option>Last 7 Days</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          
          {/* Beautiful CSS Mock Chart */}
          <div className="h-64 flex items-end justify-between space-x-2 pt-4">
            {[40, 70, 45, 90, 60, 110, 85].map((height, index) => (
              <div key={index} className="w-full flex flex-col items-center group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded">
                  ${height * 10}
                </div>
                {/* Bar */}
                <div 
                  className="w-full max-w-[40px] bg-gradient-to-t from-[#D4AF37]/20 to-[#D4AF37]/80 rounded-t-sm group-hover:to-[#D4AF37] transition-colors duration-300" 
                  style={{ height: `${height}%` }}
                ></div>
                {/* X-axis label */}
                <span className="text-gray-500 text-xs mt-3 uppercase font-medium">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">Quick Actions</h2>
          
          <div className="space-y-4">
            <Link to="/admin/products" className="flex items-center justify-between p-4 bg-[#111111] border border-gray-800 rounded-xl hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all group">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-[#D4AF37] transition-colors">
                  <PlusCircle size={20} className="text-[#D4AF37] group-hover:text-black transition-colors" />
                </div>
                <span className="font-medium text-gray-300 group-hover:text-white transition-colors">Add New Product</span>
              </div>
            </Link>

            <Link to="/admin/coupons" className="flex items-center justify-between p-4 bg-[#111111] border border-gray-800 rounded-xl hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all group">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-[#D4AF37] transition-colors">
                  <Tag size={20} className="text-[#D4AF37] group-hover:text-black transition-colors" />
                </div>
                <span className="font-medium text-gray-300 group-hover:text-white transition-colors">Create Coupon</span>
              </div>
            </Link>

            <Link to="/admin/orders" className="flex items-center justify-between p-4 bg-[#111111] border border-gray-800 rounded-xl hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all group">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center mr-3 group-hover:bg-[#D4AF37] transition-colors">
                  <ShoppingBag size={20} className="text-[#D4AF37] group-hover:text-black transition-colors" />
                </div>
                <span className="font-medium text-gray-300 group-hover:text-white transition-colors">Process Orders</span>
              </div>
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-gradient-to-br from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-xl">
            <h3 className="text-[#D4AF37] font-bold mb-1">Need Help?</h3>
            <p className="text-gray-400 text-sm mb-3">Check the documentation for managing your store effectively.</p>
            <button className="text-sm font-bold text-white hover:text-[#D4AF37] underline transition-colors">View Docs</button>
          </div>
        </div>

      </div>
    </div>
  );
}