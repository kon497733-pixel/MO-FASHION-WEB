import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ওয়েবসাইটের সমস্ত সেটিংসের টাইপ (Type) নির্ধারণ
export interface AppSettings {
  storeName: string;
  tagline: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  currency: string;
  taxRate: number;
  shippingCost: number;
  
  // Payment Options
  enableBkash: boolean;
  enableCard: boolean;
  enableCOD: boolean;
  
  // Social Links
  facebook: string;
  instagram: string;
  twitter: string;

  // FAQs (Frequently Asked Questions)
  faqs: { question: string; answer: string }[];
}

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

// Zustand ব্যবহার করে গ্লোবাল স্টোর তৈরি (Persist ব্যবহার করায় এটি অটোমেটিক LocalStorage-এ সেভ থাকবে)
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // ডিফল্ট সেটিংস (প্রথমবার ভিজিট করলে এগুলো দেখাবে)
      settings: {
        storeName: 'MO FASHION',
        tagline: 'Premium E-Commerce Experience',
        contactEmail: 'kon497733@gmail.com',
        phoneNumber: '+880 1707697445',
        address: 'Agrabad, Chattogram, Bangladesh',
        currency: 'BDT (৳)',
        taxRate: 5,
        shippingCost: 60,
        
        enableBkash: true,
        enableCard: true,
        enableCOD: true,

        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com',
        twitter: 'https://twitter.com',

        faqs: [
          { question: 'What is your return policy?', answer: 'You can return any product within 7 days of delivery.' },
          { question: 'How much is the delivery charge?', answer: 'Standard delivery charge is 60 Taka.' }
        ]
      },
      
      // সেটিংস আপডেট করার ফাংশন
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'mo_fashion_global_settings', // এই নামে LocalStorage-এ সেভ থাকবে
    }
  )
);