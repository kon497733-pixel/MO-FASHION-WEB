import { Outlet } from 'react-router-dom';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ওয়েবসাইটের একদম উপরের অংশ (হেডার বা মেনুবার) */}
      <Navbar />
      
      {/* মাঝখানের মূল অংশ (এখানে Outlet এর মাধ্যমে Home, About, Cart ইত্যাদি পেজগুলো লোড হবে) */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* ওয়েবসাইটের একদম নিচের অংশ (ফুটার) */}
      <Footer />
    </div>
  );
}