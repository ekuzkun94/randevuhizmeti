import React, { useState } from 'react';

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  active: boolean;
}

interface NewUserModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (form: UserForm) => Promise<void>;
}

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'personel', label: 'Personel' },
  { value: 'doktor', label: 'Doktor' },
];

export default function NewUserModal({ open, onClose, onAdd }: NewUserModalProps) {
  const [form, setForm] = useState<UserForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'personel',
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      await onAdd(form);
      setForm({
        firstName: '', lastName: '', email: '', phone: '', password: '', role: 'personel', active: true
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-orange-500 text-xl">×</button>
        <h2 className="text-2xl font-bold text-[#1a389c] mb-6">Yeni Kullanıcı Ekle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Ad" className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400" required />
            <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Soyad" className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400" required />
          </div>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="E-posta" className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400" required />
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Telefon (isteğe bağlı)" className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400" />
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Şifre" className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400" required minLength={6} />
          <div className="flex gap-2 items-center">
            <select name="role" value={form.role} onChange={handleChange} className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400">
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
              <span className="text-sm">Aktif</span>
            </label>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full py-2 rounded-md bg-gradient-to-r from-[#ff6a00] to-[#ffb347] text-white font-bold text-lg shadow hover:scale-105 transition-transform disabled:opacity-60">
            {loading ? 'Ekleniyor...' : 'Kullanıcıyı Ekle'}
          </button>
        </form>
      </div>
    </div>
  );
} 