import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Package, 
  Image as ImageIcon, Percent, Upload, AlertCircle 
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function Products() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  const [formData, setFormData] = useState({
    id: '', _id: '', name: '', description: '', category: '',
    price: '', discount: '', stock: '', status: 'Active', images: [''],
  });

  // 🚀 ১. লাইভ ব্যাকএন্ড থেকে সব প্রোডাক্ট লোড করার ফাংশন
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://mo-fashion-api-mehedi.onrender.com/api/products');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
        localStorage.setItem('mo_fashion_products', JSON.stringify(data));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      const saved = localStorage.getItem('mo_fashion_products');
      if (saved) setProducts(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const savedCategories = JSON.parse(localStorage.getItem('mo_fashion_categories') || '[]');
    setCategories(savedCategories.length > 0 ? savedCategories : [{ name: "Men's Collection" }]);
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ 
      id: '', _id: '', name: '', description: '', 
      category: categories.length > 0 ? categories[0].name : "Men's Collection", 
      price: '', discount: '0', stock: '10', status: 'Active', images: [''] 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setModalMode('edit');
    setFormData({
      id: product._id || product.id,
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

  // 🚀 ২. ডেস্কটপ থেকে ছবি আপলোড (এইচডি কমপ্রেশনসহ)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadIndex !== null) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleFactor = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = img.width * scaleFactor;
          canvas.height = img.height * scaleFactor;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          const updatedImages = [...formData.images];
          updatedImages[uploadIndex] = compressedBase64;
          setFormData({ ...formData, images: updatedImages });
          toast.success('Image compressed and ready!');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
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

  // 🚀 ৩. ডিলিট লজিক (সরাসরি লাইভ সার্ভার থেকে)
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const response = await fetch(`https://mo-fashion-api-mehedi.onrender.com/api/products/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          toast.success("Product deleted live!");
          fetchProducts(); // টেবিল রিফ্রেশ
        } else {
          toast.error("Failed to delete from server.");
        }
      } catch (e) {
        toast.error("Network Error!");
      }
    }
  };

  // 🚀 ৪. সেভ এবং আপডেট লজিক (১০০% ডাইনামিক লাইভ সেভ)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) {
      toast.error("Name and Price are required!");
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      price: parseFloat(formData.price.toString()),
      discount: parseInt(formData.discount.toString()) || 0,
      stock: parseInt(formData.stock.toString()) || 0,
      status: formData.status,
      category: formData.category,
      images: formData.images.filter(url => url && url.trim() !== ''),
    };

    try {
      setIsSaving(true);
      const url = modalMode === 'add' 
        ? 'https://mo-fashion-api-mehedi.onrender.com/api/products'
        : `https://mo-fashion-api-mehedi.onrender.com/api/products/${formData._id}`;

      const response = await fetch(url, {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        toast.success(modalMode === 'add' ? 'Added successfully!' : 'Updated successfully!');
        setIsModalOpen(false);
        fetchProducts(); // লাইভ ডাটা আবার টেনে আনা
      } else {
        const errData = await response.json();
        toast.error(errData.message || "Server Error!");
      }
    } catch (error) {
      toast.error("Could not connect to server!");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter((p: any) => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (categoryFilter === '' || p.category === categoryFilter)
  );

  return (
    <div className="text-white pb-10">
      <Helmet><title>Admin - Products | MO FASHION</title></Helmet>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#D4AF37] uppercase flex items-center">
            <Package className="mr-3" size={28} /> Products Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Real-time Cloud Inventory Control</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-[#D4AF37] text-black px-5 py-2.5 rounded-lg hover:bg-white font-bold flex items-center space-x-2 shadow-lg">
          <Plus size={20} /> <span>Add New Product</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#D4AF37]/20 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        <div className="relative w-full md:w-96">
          <input type="text" placeholder="Search live products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#111111] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-[#D4AF37] focus:outline-none transition-colors" />
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-[#111111] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:border-[#D4AF37] focus:outline-none cursor-pointer">
          <option value="">All Categories</option>
          {categories.map((cat: any, i: number) => (<option key={i} value={cat.name}>{cat.name}</option>))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="text-center py-20 text-[#D4AF37] animate-pulse">Synchronizing with Cloud...</div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#111111] border-b border-[#D4AF37]/20 text-xs uppercase font-bold text-gray-400">
                <tr>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price / Disc</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredProducts.map((p: any) => (
                  <tr key={p._id || p.id} className="hover:bg-[#111111]/50 transition-colors">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <img src={p.images?.[0] || 'https://via.placeholder.com/100'} alt="" className="w-12 h-12 rounded object-cover border border-gray-700" />
                      <span className="font-bold text-white truncate max-w-[200px]">{p.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{p.category}</td>
                    <td className="px-6 py-4 font-bold text-[#D4AF37]">
                      ৳{p.price} {p.discount > 0 && <span className="text-red-400 text-[10px] block">-{p.discount}% OFF</span>}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">{p.stock}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${p.status === 'Active' || p.status === 'In Stock' ? 'text-green-400 border-green-500/20' : 'text-red-400 border-red-500/20'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(p)} className="p-2 text-gray-400 hover:text-[#D4AF37]"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(p._id || p.id, p.name)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20 bg-[#111111]">
              <h2 className="text-xl font-serif font-bold text-[#D4AF37] uppercase">{modalMode === 'add' ? 'ADD NEW PRODUCT' : 'EDIT PRODUCT'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-gray-300 text-sm font-medium">Product Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white" />
                  
                  <label className="block text-gray-300 text-sm font-medium">Description</label>
                  <textarea rows={5} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white resize-none" placeholder="Enter details..."></textarea>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium">Price (৳)</label>
                      <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium">Discount (%)</label>
                      <input type="number" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white" />
                    </div>
                  </div>

                  <label className="block text-gray-300 text-sm font-medium">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white">
                    {categories.map((cat: any, i: number) => (<option key={i} value={cat.name}>{cat.name}</option>))}
                  </select>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium">Stock</label>
                      <input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium">Status</label>
                      <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white">
                        <option value="Active">Active</option>
                        <option value="In Stock">In Stock</option>
                        <option value="Low Stock">Low Stock</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multiple Images with Preview & Desktop Upload */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <label className="block text-[#D4AF37] font-bold text-sm">Image Gallery (Links or Desktop Upload)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.images.map((imgUrl, index) => (
                    <div key={index} className="flex items-center gap-3 bg-[#111111] p-3 rounded-xl border border-gray-800">
                      <div className="w-16 h-16 rounded-lg bg-[#1A1A1A] border border-gray-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {imgUrl ? <img src={imgUrl} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-700" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input type="text" value={imgUrl} onChange={(e) => handleImageChange(index, e.target.value)} placeholder="Paste link..." className="w-full bg-transparent border-b border-gray-800 text-xs text-white focus:outline-none" />
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { setUploadIndex(index); fileInputRef.current?.click(); }} className="flex-1 bg-gray-800 text-[10px] font-bold py-1 rounded text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black">UPLOAD FILE</button>
                          {formData.images.length > 1 && <button type="button" onClick={() => removeImageField(index)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <button type="button" onClick={addImageField} className="flex items-center space-x-2 text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-4 py-2 rounded-lg border border-[#D4AF37]/30">
                  <Plus size={14} /> <span>Add Another Image Link</span>
                </button>
              </div>

              <div className="pt-6 border-t border-gray-800 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-medium">Cancel</button>
                <button type="submit" disabled={isSaving} className="bg-[#D4AF37] text-black px-10 py-3 rounded-lg font-bold hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50">
                  {isSaving ? 'Pushing to Cloud...' : 'Save Product & Push Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}