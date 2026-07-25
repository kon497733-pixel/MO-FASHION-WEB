import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Ticket, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  LogOut,
  Check,
  Layers,
  Trash2 // 🚀 রিসাইকেল বিনের জন্য আইকন
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // সাইডবারের মেনু লিস্ট (এখানে Recycle Bin যুক্ত করা হলো)
  const menuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/category-management', icon: Layers, label: 'Categories' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/coupons', icon: Ticket, label: 'Coupons' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
    { path: '/admin/recycle-bin', icon: Trash2, label: 'Recycle Bin' }, // 🚀 নতুন রিসাইকেল বিন মেনু
  ];

  // ডামি নোটিফিকেশন ডাটা
  const notificationsList = [
    { id: 1, text: "New order #ORD-9876 received.", time: "2 mins ago", unread: true },
    { id: 2, text: "Stock running low for 'Premium Signature T-Shirt'.", time: "1 hour ago", unread: true },
    { id: 3, text: "New customer 'Emily Davis' registered.", time: "3 hours ago", unread: true },
  ];

  // লগআউট হ্যান্ডলার
  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success("Admin logged out successfully!");
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#111111] flex font-sans text-white">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar (বাম দিকের মেনু) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1A1A1A] border-r border-[#D4AF37]/20 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Sidebar Header (লোগো) */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-[#D4AF37]/10">
          <Link to="/admin" className="text-2xl font-serif font-bold text-[#D4AF37] tracking-widest">
            MO ADMIN
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive 
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]' 
                  : 'text-gray-400 hover:text-white hover:bg-[#111111]'
                }`}
              >
                <item.icon size={20} className={isActive ? 'text-[#D4AF37]' : ''} />
                <span className="font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (লগআউট বাটন) */}
        <div className="p-4 border-t border-[#D4AF37]/10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (ডান দিকের অংশ) */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Topbar (উপরের হেডার) */}
        <header className="h-20 bg-[#1A1A1A] border-b border-[#D4AF37]/20 flex items-center justify-between px-4 lg:px-8 z-30 shadow-sm relative">
          
          <div className="flex items-center">
            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="mr-4 lg:hidden text-gray-400 hover:text-[#D4AF37] transition-colors"
            >
              <Menu size={28} />
            </button>
            <h2 className="text-xl font-bold text-white hidden sm:block">Welcome, Admin</h2>
          </div>

          {/* Admin Profile & Notifications */}
          <div className="flex items-center space-x-5">
            
            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative text-gray-400 hover:text-[#D4AF37] transition-colors focus:outline-none mt-2"
              >
                <Bell size={24} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-[#1A1A1A]">
                  3
                </span>
              </button>

              {/* Notification Dropdown Panel */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-4 w-80 bg-[#1A1A1A] border border-[#D4AF37]/20 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-[#D4AF37]/10 flex justify-between items-center bg-[#111111]">
                    <h3 className="font-bold text-white">Notifications</h3>
                    <button className="text-xs text-[#D4AF37] hover:underline flex items-center">
                      <Check size={12} className="mr-1" /> Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    {notificationsList.map(n => (
                      <div key={n.id} className={`p-4 border-b border-gray-800 hover:bg-[#111111] transition-colors cursor-pointer ${n.unread ? 'bg-[#D4AF37]/5' : ''}`}>
                        <p className="text-sm text-gray-300">{n.text}</p>
                        <p className="text-xs text-gray-500 mt-2 font-medium">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 text-center border-t border-gray-800 bg-[#111111]">
                    <button 
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-sm text-[#D4AF37] hover:text-white transition-colors font-medium"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 pl-5 border-l border-gray-700">
              <div className="w-10 h-10 bg-[#D4AF37]/20 border border-[#D4AF37]/50 rounded-full flex items-center justify-center text-[#D4AF37] font-bold">
                A
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-bold text-white">Admin User</p>
                <p className="text-gray-400 text-xs">admin@mofashion.com</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#111111]">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}