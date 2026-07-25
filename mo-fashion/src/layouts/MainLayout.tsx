import { Outlet } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer'; // 🚀 আসল ৪ কলামের রিচ ফুটার ইমপোর্ট করা হলো

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow pt-16 pb-16 md:pb-0 safe-padding-bottom">
        <Outlet />
      </main>

      {/* 🚀 ৪ কলামের সম্পূর্ণ ফুটার (Home, Categories, About, Contact, Shipping, FAQs, Logo) */}
      <Footer />
    </div>
  );
}