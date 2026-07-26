import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Edit, Trash2, X, Package, 
  Image as ImageIcon, Percent, Upload, Tag, Box
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function Products() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);

  const API_URL = 'https://mo-fashion-api-mehedi.onrender.com/api/products';

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  const [formData, setFormData] = useState({
    _id: '', id: '', name: '', description: '', category: '',
    price: '', discount: '', stock: '', status: 'Active', images: [''],
  });

  // 🚀 লাইভ ক্লাউড ডাটাবেস থেকে প্রোডাক্ট লোড
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setProducts(data);
          localStorage.setItem('mo_fashion_products', JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error("Error fetching live products:", error);
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
      _id: '', id: '', name: '', description: '', 
      category: categories.length > 0 ? categories[0].name : "Men's Collection", 
      price: '', discount: '0', stock: '10', status: 'Active', images: [''] 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setModalMode('edit');
    setFormData({
      _id: product._id || product.id,
      id: product.id || product._id,
      name: product.name || '',
      description: product.description || '', 
      category: product.category || "Men's Collection",
      price: product.price ? product.price.toString() : '',
      discount: product.discount ? product.discount.toString() : '0',
      stock: product.stock !== undefined ? product.stock.toString() : '0',
      status: product.status || 'Active',
      images: product.images && product.images.length > 0 ? [...product.images] : (product.imageUrl ? [product.imageUrl] : [''])
    });
    setIsModalOpen(true);
  };

  // 🚀 ডেস্কটপ ফটো আপলোড কমপ্রেশন
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadIndex !== null) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; 
          const scaleFactor = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = img.width * scaleFactor;
          canvas.height = img.height * scaleFactor;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          const updatedImages = [...formData.images];
          updatedImages[uploadIndex] = compressedBase64;
          setFormData({ ...formData, images: updatedImages });
          toast.success('Image compressed and loaded!');
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

  // 🚀 ডিলিট ফাংশন
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const toastId = toast.loading("Deleting from live database...");
      try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (response.ok) {
          toast.success("Product deleted live!", { id: toastId });
          fetchProducts();
        } else {
          toast.error("Failed to delete from server", { id: toastId });
        }
      } catch (e) {
        toast.error("Network Error!", { id: toastId });
      }
    }
  };

  // 🚀 সেভ এবং আপডেট ফাংশন
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) {
      toast.error("Please enter product name and price!");
      return;
    }

    const validImages = formData.images.filter(url => url && url.trim() !== '');

    const productPayload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || 'Premium quality product',
      price: Number(formData.price),
      discount: Number(formData.discount) || 0,
      stock: Number(formData.stock) || 0,
      status: Number(formData.stock) <= 0 ? 'Out of Stock' : (formData.status || 'Active'),
      category: formData.category || "Men's Collection",
      images: validImages.length > 0 ? validImages : ['https://via.placeholder.com/600'],
      imageUrl: validImages.length > 0 ? validImages[0] : ''
    };

    setIsSaving(true);
    const toastId = toast.loading("Saving product to cloud database...");

    try {
      const url = modalMode === 'add' ? API_URL : `${API_URL}/${formData._id || formData.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productPayload)
      });

      if (response.ok) {
        toast.success("Product saved LIVE on cloud database!", { id: toastId });
        setIsModalOpen(false);
        fetchProducts(); 
      } else {
        const errJson = await response.json();
        toast.error(`Save Failed: ${errJson.message || 'Server error'}`, { id: toastId });
      }
    } catch (error: any) {
      console.error("Save Exception:", error);
      toast.error("Failed to connect to live database.", { id: toastId });
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
      <Helmet><title>Admin - Products Management | MO FASHION</title></Helmet>
      
      {/* Header Section with Total Count */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-serif font-bold text-[#D4AF37] uppercase flex items-center">
              <Package className="mr-3" size={28} /> Products Management
            </h1>
            {/* 🚀 মোট প্রোডাক্ট সংখ্যা কাউন্টার */}
            <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-bold px-3 py-1 rounded-full border border-[#D4AF37]/30 flex items-center">
              <Box size={14} className="mr-1" /> Total: {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">Manage live database inventory and stock levels</p>
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

      {/* Products Table with Detailed Badges */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="text-center py-20 text-[#D4AF37] animate-pulse">Connecting to live cloud database...</div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-[#111111] border-b border-[#D4AF37]/20 text-xs uppercase font-bold text-gray-400">
                <tr>
                  <th className="px-6 py-4">Product Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price & Discount</th>
                  <th className="px-6 py-4 text-center">Remaining Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredProducts.map((p: any) => {
                  const originalPrice = Number(p.price) || 0;
                  const discountPercent = Number(p.discount) || 0;
                  const sellingPrice = discountPercent > 0 ? originalPrice - (originalPrice * discountPercent / 100) : originalPrice;
                  const stockVal = Number(p.stock) || 0;

                  // 🚀 স্ট্যাটাস ব্যাজের কালার লজিক
                  let statusColor = 'text-green-400 bg-green-500/10 border-green-500/20';
                  let displayStatus = p.status || 'Active';
                  
                  if (stockVal <= 0 || displayStatus === 'Out of Stock') {
                    statusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
                    displayStatus = 'Out of Stock';
                  } else if (stockVal <= 5 || displayStatus === 'Low Stock') {
                    statusColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                    displayStatus = 'Low Stock';
                  }

                  return (
                    <tr key={p._id || p.id} className="hover:bg-[#111111]/50 transition-colors">
                      {/* Product Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={p.images?.[0] || p.imageUrl || 'https://via.placeholder.com/100'} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-700 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-bold text-white max-w-[180px] truncate">{p.name}</span>
                            <span className="text-[10px] text-gray-500">{p.images?.length || 1} {(p.images?.length || 1) === 1 ? 'Image' : 'Images'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-sm text-gray-400">{p.category}</td>

                      {/* 🚀 Price & Discount Badge */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#D4AF37] text-base">
                          ৳{sellingPrice.toFixed(2)}
                        </div>
                        {discountPercent > 0 ? (
                          <div className="flex items-center space-x-1.5 mt-1">
                            <span className="text-gray-500 line-through text-xs">৳{originalPrice.toFixed(2)}</span>
                            <span className="text-[10px] text-white font-extrabold bg-gradient-to-r from-orange-500 to-red-600 px-1.5 py-0.5 rounded flex items-center">
                              <Tag size={10} className="mr-0.5" /> -{discountPercent}% OFF
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-500">Regular Price</span>
                        )}
                      </td>

                      {/* 🚀 Stock Remaining */}
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold text-sm ${stockVal > 5 ? 'text-white' : stockVal > 0 ? 'text-yellow-400' : 'text-red-500'}`}>
                          {stockVal} {stockVal === 1 ? 'item' : 'units'} left
                        </span>
                      </td>

                      {/* 🚀 Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${statusColor}`}>
                          {displayStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenEdit(p)} className="p-2 text-gray-400 hover:text-[#D4AF37]"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(p._id || p.id, p.name)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#D4AF37]/20 bg-[#111111]">
              <h2 className="text-xl font-serif font-bold text-[#D4AF37] uppercase">{modalMode === 'add' ? 'Add Product' : 'Edit Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto custom-scrollbar p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <label className="block text-gray-300 text-sm font-medium">Product Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none" />
                  
                  <label className="block text-gray-300 text-sm font-medium">Product Description</label>
                  <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none resize-none" placeholder="Details..."></textarea>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium">Price (৳) *</label>
                      <input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white" />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm font-medium">Discount (%)</label>
                      <input type="number" min="0" max="99" value={formData.discount} onChange={(e) => setFormData({...formData, discount: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white" placeholder="e.g. 10" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-gray-300 text-sm font-medium">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white cursor-pointer">
                    {categories.map((cat: any, i: number) => (<option key={i} value={cat.name}>{cat.name}</option>))}
                  </select>

                  <label className="block text-gray-300 text-sm font-medium">Stock Quantity *</label>
                  <input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white" />

                  <label className="block text-gray-300 text-sm font-medium">Product Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-[#111111] border border-gray-700 rounded-lg p-3 text-white focus:border-[#D4AF37] focus:outline-none cursor-pointer">
                    <option value="Active">Active</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Image Section */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <label className="block text-[#D4AF37] font-bold text-sm flex items-center gap-2">
                  <ImageIcon size={18} /> Product Images Gallery
                </label>
                
                {formData.images.map((imgUrl, index) => (
                  <div key={index} className="flex items-center gap-3 bg-[#111111] p-3 rounded-xl border border-gray-800">
                    <div className="w-14 h-14 rounded-lg bg-[#1A1A1A] border border-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {imgUrl ? <img src={imgUrl} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-gray-600" />}
                    </div>
                    
                    <input type="text" value={imgUrl} onChange={(e) => handleImageChange(index, e.target.value)} placeholder="Paste copied image URL here..." className="flex-1 bg-transparent border-b border-gray-800 py-1 text-sm text-white focus:border-[#D4AF37] focus:outline-none" />
                    
                    <button type="button" onClick={() => { setUploadIndex(index); fileInputRef.current?.click(); }} className="p-2 bg-gray-800 rounded-lg text-[#D4AF37] hover:bg-white hover:text-black transition-colors" title="Upload from desktop">
                      <Upload size={18} />
                    </button>

                    {formData.images.length > 1 && (
                      <button type="button" onClick={() => removeImageField(index)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={18} /></button>
                    )}
                  </div>
                ))}
                
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <button type="button" onClick={addImageField} className="text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-4 py-2 rounded-lg border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black transition-all">Add Another Image</button>
              </div>

              <div className="pt-6 border-t border-gray-800 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-lg border border-gray-700 text-gray-300 font-medium hover:bg-gray-800 transition-colors">Cancel</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-[#D4AF37] text-black px-10 py-3 rounded-lg font-bold hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Pushing to Live Database...' : 'Save Product & Push Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}