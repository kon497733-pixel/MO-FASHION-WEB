import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Package, Image as ImageIcon, Percent } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function Products() {
  // 🚀 ডিফল্ট হিসেবে লোকাল স্টোরেজ থেকে ডাটা নিয়ে নিচ্ছি, যাতে লোডিং জিরো হয়
  const [products, setProducts] = useState<any[]>(() => {
    const saved = localStorage.getItem('mo_fashion_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [categories, setCategories] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  const [formData, setFormData] = useState({
    id: '', _id: '', name: '', description: '', category: '',
    price: '', discount: '', stock: '', status: 'Active', images: [''],
  });

  // 🚀 ব্যাকগ্রাউন্ডে সাইলেন্টলি ফায়ারবেস থেকে ডাটা সিঙ্ক করা
  useEffect(() => {
    const fetchProductsSilently = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const prodsArray = querySnapshot.docs.map(docData => ({
          id: docData.id, _id: docData.id, ...docData.data()
        }));
        
        if (prodsArray.length > 0) {
          setProducts(prodsArray);
          localStorage.setItem('mo_fashion_products', JSON.stringify(prodsArray));
        }
      } catch (error) {
        console.warn("Silent background fetch failed. Using local data.");
      }
    };

    fetchProductsSilently();

    const savedCategories = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
    if (savedCategories.length > 0) {
      setCategories(savedCategories);
    } else {
      setCategories([{ id: 1, name: "Men's Collection" }, { id: 2, name: "Women's Collection" }]);
    }
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    const newId = Date.now().toString();
    setFormData({ 
      id: newId, _id: newId, name: '', description: '', 
      category: categories.length > 0 ? categories[0].name : "Men's Collection", 
      price: '', discount: '0', stock: '10', status: 'Active', images: [''] 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setModalMode('edit');
    setFormData({
      id: product.id || product._id,
      _id: product._id || product.id,
      name: product.name || '',
      description: product.description || '', 
      category: product.category || "Men's Collection",
      price: product.price ? product.price.toString() : '',
      discount: product.discount ? product.discount.toString() : '0',
      stock: product.stock !== undefined ? product.stock.toString() : '0',
      status: product.status || 'Active',
      images: product.images && product.images.length > 0 ? [...product.images] : ['']
    });
    setIsModalOpen(true);
  };

  // 🚀 ইনস্ট্যান্ট ডিলিট (Optimistic UI)
  const handleDelete = async (id: string | number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      // ১. স্ক্রিন থেকে সাথে সাথে মুছে ফেলা
      const updated = products.filter((p) => (p.id !== id && p._id !== id));
      setProducts(updated);
      localStorage.setItem('mo_fashion_products', JSON.stringify(updated));
      toast.success("Product deleted successfully!");

      // ২. ব্যাকগ্রাউন্ডে ডাটাবেস থেকে মোছা
      try {
        await deleteDoc(doc(db, "products", String(id)));
      } catch (error) {
        console.warn("Cloud delete failed.");
      }
    }
  };

  const handleImageChange = (index: number, value: string) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData({ ...formData, images: updatedImages });
  };
  const addImageField = () => setFormData({ ...formData, images: [...formData.images, ''] });
  const removeImageField = (index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
  };

  // 🚀 ১০০% সুপার ফাস্ট সেভ (Optimistic UI)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) {
      toast.error("Please fill all required fields!");
      return;
    }

    const priceNum = parseFloat(formData.price.toString());
    const stockNum = parseInt(formData.stock.toString()) || 0;
    const validImages = formData.images.filter(url => url && url.trim() !== '');

    const productData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      price: priceNum,
      discount: parseInt(formData.discount.toString()) || 0,
      stock: stockNum,
      status: stockNum <= 0 ? 'Out of Stock' : (formData.status || 'Active'),
      category: formData.category || "Men's Collection",
      images: validImages.length > 0 ? validImages : ['https://via.placeholder.com/600'],
      imageUrl: validImages.length > 0 ? validImages[0] : '',
      updatedAt: new Date().toISOString()
    };

    const targetId = formData._id || formData.id || Date.now().toString();
    const localProductObj = { id: targetId, _id: targetId, ...productData };

    // ১. ইনস্ট্যান্ট স্ক্রিনে ও লোকাল স্টোরেজে সেভ (০.১ সেকেন্ড)
    let updatedList = [];
    if (modalMode === 'add') {
      updatedList = [localProductObj, ...products];
    } else {
      updatedList = products.map(p => (p.id === targetId || p._id === targetId) ? localProductObj : p);
    }

    setProducts(updatedList);
    localStorage.setItem('mo_fashion_products', JSON.stringify(updatedList));
    
    setIsModalOpen(false);
    toast.success(modalMode === 'add' ? 'Product added successfully!' : 'Product updated successfully!');

    // ২. ব্যাকগ্রাউন্ডে ক্লাউড ডাটাবেজে সেভ করা
    try {
      if (modalMode === 'add') {
        const docRef = await addDoc(collection(db, "products"), productData);
        // ফায়ারবেস নতুন আইডি দিলে সেটি দিয়ে আপডেট করে দেওয়া
        const finalObj = { id: docRef.id, _id: docRef.id, ...productData };
        const finalList = [finalObj, ...products];
        setProducts(finalList);
        localStorage.setItem('mo_fashion_products', JSON.stringify(finalList));
      } else {
        const productRef = doc(db, "products", String(targetId));
        await updateDoc(productRef, productData);
      }
    } catch (error) {
      console.warn("Cloud Sync delayed, but data is saved locally.");
    }
  };

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === '' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="text-white pb-10">
      <Helmet><title>Admin - Products Management | MO FASHION</title></Helmet>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#D4AF37] uppercase flex items-center">
            <Package className="mr-3 text-[#D4AF37]" size={28} /> Products Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage live database inventory with instant sync</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-[#D4AF37] text-black px-5 py-2.5 rounded hover:bg-white font-bold flex items-center space-x-2">
          <Plus size={20} /> <span>Add New Product</span>
        </button>
      </div>

      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#D4AF37]/20 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#111111] border border-[#D4AF37]/30 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none" />
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        </div>
        <div className="w-full md:w-auto">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-[#111111] border border-[#D4AF37]/30 rounded-lg px-4 py-2.5 text-white focus:outline-none cursor-pointer">
            <option value="">All Categories</option>
            {categories.map((cat: any) => (<option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>))}
          </select>
        </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#111111] border-b border-[#D4AF37]/20">
              <tr>
                <th className="px-6 py-4 text-xs uppercase font-bold text-gray-300">Product</th>
                <th className="px-6 py-4 text-xs uppercase font-bold text-gray-300">Category</th>
                <th className="px-6 py-4 text-xs uppercase font-bold text-gray-300">Price & Discount</th>
                <th className="px-6 py-4 text-xs uppercase font-bold text-gray-300">Stock</th>
                <th className="px-6 py-4 text-xs uppercase font-bold text-gray-300">Status</th>
                <th className="px-6 py-4 text-xs uppercase font-bold text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredProducts.map((product: any) => {
                const stockVal = Number(product.stock) || 0;
                const currentStatus = stockVal <= 0 ? 'Out of Stock' : (product.status || 'Active');
                const displayImage = product.images && product.images.length > 0 ? product.images[0] : product.imageUrl;

                return (
                  <tr key={product.id} className="hover:bg-[#111111]/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img src={displayImage} alt={product.name} className="w-12 h-12 rounded object-cover border border-gray-700" />
                        <span className="font-bold text-white max-w-[200px] truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{product.category}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#D4AF37]">${Number(product.price).toFixed(2)}</div>
                      {product.discount > 0 && (
                        <div className="text-xs text-red-400 font-bold bg-red-500/10 inline-block px-2 py-0.5 rounded mt-1">{product.discount}% OFF</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{stockVal} items</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentStatus === 'Active' ? 'text-green-400 border-green-500/20' : 'text-red-400 border-red-500/20'}`}>
                        {currentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(product)} className="p-2 text-gray-400 hover:text-[#D4AF37]"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(product.id, product.name)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20 bg-[#111111]">
              <h2 className="text-xl font-serif font-bold text-[#D4AF37] uppercase">{modalMode === 'add' ? 'ADD NEW PRODUCT' : 'EDIT PRODUCT'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar p-6 space-y-5">
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Product Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Product Description</label>
                <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none cursor-pointer">
                    {categories.map((cat: any) => (<option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Price ($ / ৳) *</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-gray-300 text-sm mb-2 font-medium flex items-center">Discount (%)</label>
                  <input type="number" min="0" max="99" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Stock *</label>
                  <input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-[#D4AF37] font-bold text-sm">Product Images (URLs)</label>
                {formData.images.map((imgUrl, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" value={imgUrl} onChange={(e) => handleImageChange(index, e.target.value)} placeholder="Paste Image URL here..." className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-[#D4AF37] focus:outline-none text-sm" />
                    {formData.images.length > 1 && (<button type="button" onClick={() => removeImageField(index)} className="bg-red-500/10 text-red-500 p-2 rounded-lg"><X size={18} /></button>)}
                  </div>
                ))}
                <button type="button" onClick={addImageField} className="text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-3 py-1.5 rounded">Add Image Link</button>
              </div>

              <div className="pt-6 border-t border-gray-800 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 font-medium">Cancel</button>
                <button type="submit" className="bg-[#D4AF37] text-black px-8 py-2.5 rounded-lg font-bold hover:bg-white transition-colors shadow-lg active:scale-95">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}