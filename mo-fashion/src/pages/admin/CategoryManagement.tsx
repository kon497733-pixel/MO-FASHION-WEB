import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Image as ImageIcon, Folder } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    images: ['']
  });

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const catArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(catArray);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({ id: '', name: '', description: '', images: [''] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setModalMode('edit');
    setFormData({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      images: category.images && category.images.length > 0 ? [...category.images] : ['']
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "categories", id));
        setCategories(categories.filter(c => c.id !== id));
        toast.success("Category deleted live!");
      } catch (e) {
        toast.error("Error deleting category");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const validImages = formData.images.filter(img => img.trim() !== '');
    const catData = {
      name: formData.name,
      description: formData.description,
      images: validImages.length > 0 ? validImages : ['https://via.placeholder.com/600'],
      updatedAt: new Date().toISOString()
    };

    try {
      if (modalMode === 'add') {
        const docRef = await addDoc(collection(db, "categories"), catData);
        setCategories([{ id: docRef.id, ...catData }, ...categories]);
        toast.success("Category saved to live database!");
      } else {
        await updateDoc(doc(db, "categories", formData.id), catData);
        setCategories(categories.map(c => c.id === formData.id ? { id: formData.id, ...catData } : c));
        toast.success("Category updated live!");
      }
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Failed to save category");
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
        <button onClick={handleOpenAdd} className="bg-[#D4AF37] text-black px-5 py-2.5 rounded font-bold flex items-center space-x-2">
          <Plus size={20} /> <span>Add Category</span>
        </button>
      </div>

      <div className="bg-[#1A1A1A] rounded-xl border border-[#D4AF37]/20 p-6">
        {loading ? <div className="text-center text-[#D4AF37] animate-pulse">Loading Categories...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat: any) => (
              <div key={cat.id} className="bg-[#111111] p-4 rounded-xl border border-gray-800 space-y-3">
                <div className="h-40 bg-[#1A1A1A] rounded-lg overflow-hidden relative">
                  {cat.images && cat.images[0] ? (
                    <img src={cat.images[0]} alt={cat.name} className="w-full h-full object-cover" />
                  ) : <Folder className="w-full h-full p-10 text-gray-600" />}
                </div>
                <h3 className="font-bold text-lg text-white">{cat.name}</h3>
                <p className="text-xs text-gray-400">{cat.description}</p>
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-800">
                  <button onClick={() => handleOpenEdit(cat)} className="p-2 text-gray-400 hover:text-[#D4AF37]"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#1A1A1A] border border-[#D4AF37]/30 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#D4AF37]">{modalMode === 'add' ? 'ADD CATEGORY' : 'EDIT CATEGORY'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" required placeholder="Category Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111111] border border-gray-700 p-3 rounded text-white" />
              <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#111111] border border-gray-700 p-3 rounded text-white resize-none" />
              <div className="space-y-2">
                <label className="text-xs text-[#D4AF37] font-bold">Category Images (URLs for Slideshow)</label>
                {formData.images.map((img, i) => (
                  <input key={i} type="text" placeholder="Image URL..." value={img} onChange={(e) => {
                    const arr = [...formData.images]; arr[i] = e.target.value; setFormData({...formData, images: arr});
                  }} className="w-full bg-[#111111] border border-gray-700 p-2 text-xs rounded text-white" />
                ))}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-700 rounded text-gray-300">Cancel</button>
                <button type="submit" className="bg-[#D4AF37] text-black px-6 py-2 rounded font-bold">Save to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}