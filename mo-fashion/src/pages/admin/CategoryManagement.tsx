import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, Image as ImageIcon, Folder, Upload } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function CategoryManagement() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadIndex, setUploadIndex] = useState<number | null>(null);

  // 🚀 Local Storage পুরোপুরি বাদ দেওয়া হয়েছে।
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    description: '',
    images: ['']
  });

  // 🚀 ১. শুধুমাত্র ডাটাবেজ (MongoDB API) থেকে আসল ক্যাটাগরি ফেচ করা
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories([]);
        }
      }
    } catch (e) {
      console.error("Database connection failed", e);
      // ডাটাবেস এরর দিলেও কোনো ডামি ডাটা তৈরি হবে না
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // 🚀 ২. ইমেজ আপলোড হ্যান্ডলার (অক্ষত রাখা হয়েছে)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadIndex !== null) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; 
          const scaleFactor = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = img.width * scaleFactor;
          canvas.height = img.height * scaleFactor;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); 
          const updatedImages = [...formData.images];
          updatedImages[uploadIndex] = compressedBase64;
          setFormData({ ...formData, images: updatedImages });
          toast.success('Image loaded successfully!');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ _id: '', name: '', description: '', images: [''] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setModalMode('edit');
    setFormData({
      _id: category._id || '',
      name: category.name || '',
      description: category.description || '',
      images: category.images && category.images.length > 0 ? [...category.images] : ['']
    });
    setIsModalOpen(true);
  };

  // 🚀 ৩. ডাটাবেস থেকে ডিলিট করার API কল
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setCategories(categories.filter(c => c._id !== id));
          toast.success("Category deleted completely from database!");
        } else {
          toast.error("Failed to delete from database.");
        }
      } catch (e) {
        toast.error("Server connection error.");
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

  // 🚀 ৪. ডাটাবেসে সেভ করার API (POST/PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Category name is required!");
      return;
    }

    const validImages = formData.images.filter(img => img && img.trim() !== '');
    const catData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      images: validImages.length > 0 ? validImages : ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop']
    };

    const toastId = toast.loading("Saving category to Database...");

    try {
      let response;
      if (modalMode === 'add') {
        response = await fetch('http://localhost:5000/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catData)
        });
      } else {
        response = await fetch(`http://localhost:5000/api/categories/${formData._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catData)
        });
      }

      if (response.ok) {
        toast.success(`Category ${modalMode === 'add' ? 'added' : 'updated'} successfully!`, { id: toastId });
        fetchCategories(); // ক্লাউড ডাটাবেস থেকে ফ্রেশ ডাটা লোড করা
        setIsModalOpen(false);
      } else {
        toast.error("Failed to save category.", { id: toastId });
      }
    } catch (e: any) {
      toast.error("Server connection failed! Make sure backend is running.", { id: toastId });
    }
  };

  return (
    <div className="text-white pb-10">
      <Helmet><title>Admin - Categories | MO FASHION</title></Helmet>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#D4AF37] uppercase">Category Management</h1>
          <p className="text-sm text-gray-400">Manage live categories and background slideshow images</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-[#D4AF37] text-black px-5 py-2.5 rounded-lg hover:bg-white font-bold flex items-center space-x-2 shadow-lg">
          <Plus size={20} /> <span>Add Category</span>
        </button>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 p-6 shadow-xl">
        {loading ? (
          <div className="text-center text-[#D4AF37] animate-pulse py-10">Loading Database Categories...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No categories found in Database. Please add a category.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat: any) => (
              <div key={cat._id} className="bg-[#111111] p-4 rounded-xl border border-gray-800 space-y-3 shadow-md">
                <div className="h-44 bg-[#1A1A1A] rounded-lg overflow-hidden relative border border-gray-800">
                  {cat.images && cat.images[0] ? (
                    <img src={cat.images[0]} alt={cat.name} className="w-full h-full object-cover" />
                  ) : <Folder className="w-full h-full p-10 text-gray-600" />}
                  
                  {cat.images && cat.images.length > 1 && (
                    <span className="absolute top-2 right-2 bg-black/80 text-[#D4AF37] text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                      {cat.images.length} Slideshow Images
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-white">{cat.name}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{cat.description || 'No description provided'}</p>
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-800">
                  <button onClick={() => handleOpenEdit(cat)} className="p-2 text-gray-400 hover:text-[#D4AF37]"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(cat._id, cat.name)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h2 className="text-xl font-bold text-[#D4AF37] uppercase">{modalMode === 'add' ? 'ADD CATEGORY' : 'EDIT CATEGORY'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar pr-1">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Category Name *</label>
                <input type="text" required placeholder="e.g. Men's Collection" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111111] border border-gray-700 p-3 rounded-lg text-white focus:border-[#D4AF37] focus:outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">Description</label>
                <textarea rows={3} placeholder="Description..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#111111] border border-gray-700 p-3 rounded-lg text-white resize-none focus:border-[#D4AF37] focus:outline-none" />
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs text-[#D4AF37] font-bold">Category Slideshow Images (Desktop or URLs)</label>
                {formData.images.map((img, i) => (
                  <div key={i} className="flex gap-2 items-center bg-[#111111] p-2 rounded-lg border border-gray-800">
                    <div className="w-10 h-10 rounded bg-[#1A1A1A] border border-gray-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {img ? <img src={img} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-600" />}
                    </div>
                    <input type="text" placeholder="Paste image URL..." value={img} onChange={(e) => handleImageChange(i, e.target.value)} className="flex-1 bg-transparent border-b border-gray-800 p-1 text-xs text-white focus:border-[#D4AF37] focus:outline-none" />
                    
                    <button type="button" onClick={() => { setUploadIndex(i); fileInputRef.current?.click(); }} className="p-2 bg-gray-800 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black rounded-md transition-colors" title="Upload from desktop">
                      <Upload size={14} />
                    </button>

                    {formData.images.length > 1 && (
                      <button type="button" onClick={() => removeImageField(i)} className="text-red-500 hover:text-red-400 p-1"><X size={16} /></button>
                    )}
                  </div>
                ))}

                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                
                <button type="button" onClick={addImageField} className="text-[#D4AF37] text-xs font-bold bg-[#D4AF37]/10 px-3 py-1.5 rounded border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black transition-all">
                  + Add Another Image
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border border-gray-700 rounded-lg text-gray-300 font-medium">Cancel</button>
                <button type="submit" className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold hover:bg-white transition-all shadow-md">Save Category to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}