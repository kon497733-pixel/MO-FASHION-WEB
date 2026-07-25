import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Package, Image as ImageIcon, Percent } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function Products() {
  // ডাটাবেস থেকে আসা প্রোডাক্ট রাখার স্টেট
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // ফর্মে ডেসক্রিপশন ফিল্ড যুক্ত করা হলো
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '', // 🚀 প্রোডাক্ট ডেসক্রিপশন
    category: '',
    price: '',
    discount: '', 
    stock: '',
    status: 'Active',
    images: [''],
  });

  // 🚀 ফায়ারবেস ক্লাউড ডাটাবেজ থেকে রিয়েল-টাইম প্রোডাক্ট লোড করার লজিক
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'products'));
      const prodsArray = querySnapshot.docs.map(docData => ({
        id: docData.id,
        _id: docData.id, // ব্যাকওয়ার্ড কম্প্যাটিবিলিটির জন্য
        ...docData.data()
      }));

      setProducts(prodsArray);
      localStorage.setItem('mo_fashion_products', JSON.stringify(prodsArray));
    } catch (error) {
      console.error("Error loading products from Firestore:", error);
      // ফায়ারবেস কানেক্টেড না থাকলে লোকাল ব্যাকআপ থেকে লোড করবে
      const savedProducts = localStorage.getItem('mo_fashion_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const savedCategories = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
    if (savedCategories.length > 0) {
      setCategories(savedCategories);
    } else {
      setCategories([
        { id: 1, name: "Men's Collection" }, 
        { id: 2, name: "Women's Collection" },
        { id: 3, name: "Accessories" }
      ]);
    }
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ 
      id: '', 
      name: '', 
      description: '', // নতুন প্রোডাক্টে ফাঁকা থাকবে
      category: categories.length > 0 ? categories[0].name : "Men's Collection", 
      price: '', 
      discount: '0', 
      stock: '10', 
      status: 'Active', 
      images: [''] 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setModalMode('edit');
    setFormData({
      id: product.id || product._id,
      name: product.name || '',
      description: product.description || '', // ডেসক্রিপশন লোড হবে
      category: product.category || "Men's Collection",
      price: product.price ? product.price.toString() : '',
      discount: product.discount ? product.discount.toString() : '0',
      stock: product.stock !== undefined ? product.stock.toString() : '0',
      status: product.status || 'Active',
      images: product.images && product.images.length > 0 ? [...product.images] : ['']
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "products", id));
        const updated = products.filter((p) => (p.id !== id && p._id !== id));
        setProducts(updated);
        localStorage.setItem('mo_fashion_products', JSON.stringify(updated));
        toast.success("Product deleted successfully from Cloud Database!");
      } catch (error: any) {
        toast.error(`Delete failed: ${error.message}`);
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

  // 🚀 ১০০% ফায়ারবেস ক্লাউড সেভ হ্যান্ডলার
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a product name!");
      return;
    }

    const priceNum = parseFloat(formData.price.toString());
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid price!");
      return;
    }

    const stockNum = parseInt(formData.stock.toString()) || 0;
    const validImages = formData.images.filter(url => url && url.trim() !== '');

    const productData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || 'Premium quality fashion product.', // ডেসক্রিপশন সেভ করা হচ্ছে
      price: priceNum,
      discount: parseInt(formData.discount.toString()) || 0,
      stock: stockNum,
      status: stockNum <= 0 ? 'Out of Stock' : (formData.status || 'Active'),
      category: formData.category || "Men's Collection",
      images: validImages.length > 0 ? validImages : ['https://via.placeholder.com/600'],
      imageUrl: validImages.length > 0 ? validImages[0] : '',
      updatedAt: new Date().toISOString()
    };

    try {
      setIsSaving(true);
      let updatedList = [];

      if (modalMode === 'add') {
        const docRef = await addDoc(collection(db, "products"), productData);
        const newProdObj = { id: docRef.id, _id: docRef.id, ...productData };
        updatedList = [newProdObj, ...products];
        toast.success("Product added live to Cloud Database!");
      } else {
        const productRef = doc(db, "products", formData.id);
        await updateDoc(productRef, productData);
        updatedList = products.map(p => (p.id === formData.id || p._id === formData.id) ? { id: formData.id, _id: formData.id, ...productData } : p);
        toast.success("Product updated live in Cloud Database!");
      }

      setProducts(updatedList);
      localStorage.setItem('mo_fashion_products', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('productsUpdated'));
      
      setIsModalOpen(false);

    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Save Failed: ${error.message || "Check connection"}`);
    } finally {
      setIsSaving(false);
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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#D4AF37] uppercase flex items-center">
            <Package className="mr-3 text-[#D4AF37]" size={28} /> Products Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage live database inventory in real-time</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-[#D4AF37] text-black px-5 py-2.5 rounded hover:bg-white font-bold flex items-center space-x-2">
          <Plus size={20} /> <span>Add New Product</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#D4AF37]/20 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-[#111111] border border-[#D4AF37]/30 rounded-lg px-10 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]" 
          />
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        </div>
        
        <div className="w-full md:w-auto">
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-[#111111] border border-[#D4AF37]/30 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="text-center py-10 text-[#D4AF37] animate-pulse">Loading live products...</div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#111111] border-b border-[#D4AF37]/20">
                <tr>
                  <th className="px-6 py-4 text-xs uppercase font-bold text-gray-300">Product Info</th>
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
                    <tr key={product.id || product._id} className="hover:bg-[#111111]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[#111111] border border-gray-800 rounded overflow-hidden flex items-center justify-center">
                            {displayImage ? (
                              <img src={displayImage} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-[#D4AF37]/50" />
                            )}
                          </div>
                          <span className="font-bold text-white max-w-[200px] truncate">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{product.category}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#D4AF37]">${Number(product.price).toFixed(2)}</div>
                        {product.discount > 0 && (
                          <div className="text-xs text-red-400 font-bold bg-red-500/10 inline-block px-2 py-0.5 rounded mt-1">
                            {product.discount}% OFF
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-white">{stockVal} items</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentStatus === 'Active' ? 'text-green-400 border-green-500/20' : 'text-red-400 border-red-500/20'}`}>
                          {currentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-3">
                          <button onClick={() => handleOpenEdit(product)} className="p-2 text-gray-400 hover:text-[#D4AF37] transition-colors bg-[#111111] rounded-md border border-gray-800 hover:border-[#D4AF37]/50"><Edit size={16} /></button>
                          <button onClick={() => handleDelete(product.id || product._id, product.name)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-[#111111] rounded-md border border-gray-800 hover:border-red-500/50"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No products found. Click "Add New Product" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20 bg-[#111111]">
              <h2 className="text-xl font-serif font-bold text-[#D4AF37] uppercase">
                {modalMode === 'add' ? 'ADD NEW PRODUCT' : 'EDIT PRODUCT'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar p-6 space-y-5">
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Product Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none" />
              </div>

              {/* 🚀 ৩. নতুন Product Description বক্স */}
              <div>
                <label className="block text-gray-300 text-sm mb-2 font-medium">Product Description *</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] resize-none"
                  placeholder="Enter detailed product description..."
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer">
                    {categories.map((cat: any) => (<option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer">
                    <option value="Active">Active</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Price ($ / ৳) *</label>
                  <input type="number" step="0.01" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-2 font-medium flex items-center">
                    Discount (%) <Percent size={14} className="ml-1 text-gray-500" />
                  </label>
                  <input type="number" min="0" max="99" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm mb-2 font-medium">Stock *</label>
                  <input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]" />
                </div>
              </div>

              {/* Multiple Images Section */}
              <div className="space-y-3">
                <label className="block text-[#D4AF37] font-bold text-sm">Product Images (URLs)</label>
                {formData.images.map((imgUrl, index) => (
                  <div key={index} className="flex gap-2">
                    <input type="text" value={imgUrl} onChange={(e) => handleImageChange(index, e.target.value)} placeholder="Paste Image URL here..." className="w-full bg-[#111111] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37] text-sm" />
                    {formData.images.length > 1 && (<button type="button" onClick={() => removeImageField(index)} className="bg-red-500/10 text-red-500 p-2.5 rounded-lg border border-red-500/30 hover:bg-red-500 hover:text-white"><X size={18} /></button>)}
                  </div>
                ))}
                <button type="button" onClick={addImageField} className="text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-3 py-1.5 rounded border border-[#D4AF37]/20">Add Image Link</button>
              </div>

              <div className="pt-6 border-t border-gray-800 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-300 font-medium">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-[#D4AF37] text-black px-8 py-2.5 rounded-lg font-bold hover:bg-white transition-colors shadow-lg disabled:opacity-50"
                >
                  {isSaving ? 'Saving to Database...' : 'Save to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}