import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  status: 'active' | 'inactive';
}

interface EditUserForm {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onEdit: (userId: string, form: EditUserForm) => Promise<void>;
  user: User | null;
}

export default function EditUserModal({ open, onClose, onEdit, user }: EditUserModalProps) {
  const [form, setForm] = useState<EditUserForm>({
    name: '',
    email: '',
    phone: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        status: user.status,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');
    if (!form.name || !form.email) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    
    setLoading(true);
    try {
      await onEdit(user.id, form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-xl">×</button>
        <h2 className="text-2xl font-bold text-[#1a389c] mb-6">Kullanıcı Düzenle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            placeholder="Ad Soyad" 
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400" 
            required 
          />
          <input 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={handleChange} 
            placeholder="E-posta" 
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400" 
            required 
          />
          <input 
            name="phone" 
            type="tel" 
            value={form.phone} 
            onChange={handleChange} 
            placeholder="Telefon" 
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400" 
          />
          <select 
            name="status" 
            value={form.status} 
            onChange={handleChange} 
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400"
          >
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2 rounded-md bg-gradient-to-r from-[#1a389c] to-[#274baf] text-white font-bold text-lg shadow hover:scale-105 transition-transform disabled:opacity-60"
          >
            {loading ? 'Güncelleniyor...' : 'Güncelle'}
          </button>
        </form>
      </div>
    </div>
  );
} 