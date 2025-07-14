'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'
import NewUserModal from '@/components/NewUserModal';
import EditUserModal from '@/components/EditUserModal';
import { auth, db } from '@/lib/firebase';
import { adminAuth } from '@/lib/adminAuth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';

interface User {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
  status: 'active' | 'inactive'
}

interface UserForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  role: string
  active: boolean
}

export default function UsersPage() {
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      // Firestore'dan kullanıcıları çek
      const fetchUsers = async () => {
        try {
          const usersQuery = query(collection(db, 'users'), orderBy('created_at', 'desc'));
          const querySnapshot = await getDocs(usersQuery);
          const usersData: User[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            usersData.push({
              id: doc.id,
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
              status: data.status || 'active'
            });
          });
          
          setUsers(usersData);
        } catch (error) {
          console.error('Kullanıcılar yüklenirken hata:', error);
          // Hata durumunda demo verileri göster
          setUsers([
            {
              id: '1',
              name: 'Ahmet Yılmaz',
              email: 'ahmet@email.com',
              phone: '+90 555 123 4567',
              created_at: '2024-01-15',
              status: 'active'
            },
            {
              id: '2',
              name: 'Fatma Demir',
              email: 'fatma@email.com',
              phone: '+90 555 987 6543',
              created_at: '2024-02-20',
              status: 'active'
            }
          ]);
        } finally {
          setDataLoading(false);
        }
      };
      
      fetchUsers();
    }
  }, [user, loading, router])

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Kullanıcı ekleme fonksiyonu
  const handleAddUser = async (form: UserForm) => {
    try {
      // Admin Auth ile kullanıcı oluştur (mevcut kullanıcıyı etkilemez)
      const userCredential = await createUserWithEmailAndPassword(
        adminAuth, 
        form.email, 
        form.password
      );

      // Firestore'a kullanıcı bilgilerini kaydet
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone || '',
        role: form.role,
        status: form.active ? 'active' : 'inactive',
        created_at: serverTimestamp(),
      });

      // Kullanıcı listesini güncelle
      const newUser: User = {
        id: userCredential.user.uid,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone || '',
        created_at: new Date().toISOString(),
        status: form.active ? 'active' : 'inactive'
      };

      setUsers(prev => [newUser, ...prev]);
      setShowModal(false);
      
      // Başarı mesajı göster
      alert('Kullanıcı başarıyla eklendi!');
      
    } catch (error: any) {
      console.error('Kullanıcı ekleme hatası:', error);
      let errorMessage = 'Kullanıcı eklenirken bir hata oluştu.';
      
      // Firebase hata mesajlarını Türkçe'ye çevir
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Bu email adresi zaten kullanımda.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz email adresi.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Şifre çok zayıf. En az 6 karakter olmalı.';
          break;
        default:
          errorMessage = error.message || 'Kullanıcı eklenirken bir hata oluştu.';
      }
      
      throw new Error(errorMessage);
    }
  };

  // Kullanıcı silme fonksiyonu
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Firestore'dan kullanıcıyı sil
      await deleteDoc(doc(db, 'users', userId));
      
      // Kullanıcı listesini güncelle
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      alert('Kullanıcı başarıyla silindi!');
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      alert('Kullanıcı silinirken bir hata oluştu.');
    }
  };

  // Kullanıcı düzenleme fonksiyonu
  const handleEditUser = async (userId: string, form: { name: string; email: string; phone: string; status: 'active' | 'inactive' }) => {
    try {
      // Firestore'da kullanıcıyı güncelle
      await updateDoc(doc(db, 'users', userId), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        status: form.status,
        updated_at: serverTimestamp(),
      });
      
      // Kullanıcı listesini güncelle
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, name: form.name, email: form.email, phone: form.phone, status: form.status }
          : user
      ));
      
      alert('Kullanıcı başarıyla güncellendi!');
    } catch (error) {
      console.error('Kullanıcı güncelleme hatası:', error);
      throw new Error('Kullanıcı güncellenirken bir hata oluştu.');
    }
  };

  // Düzenleme modal'ını aç
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  if (loading || dataLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Yükleniyor...</div>
    </div>
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Kullanıcılar</h1>
            <p className="mt-2 text-gray-600">Sistemdeki tüm kullanıcıları yönetin</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-[#ff6a00] to-[#ffb347] hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400"
              onClick={() => setShowModal(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Yeni Kullanıcı
            </button>
          </div>
        </div>
        <NewUserModal open={showModal} onClose={() => setShowModal(false)} onAdd={handleAddUser} />
        <EditUserModal 
          open={showEditModal} 
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }} 
          onEdit={handleEditUser} 
          user={selectedUser} 
        />

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 max-w-lg">
                <label htmlFor="search" className="sr-only">Kullanıcı ara</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Kullanıcı ara..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrele
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İletişim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıt Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-2 text-gray-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(user.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900" onClick={() => openEditModal(user)}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Önceki
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Sonraki
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Toplam <span className="font-medium">{filteredUsers.length}</span> kullanıcıdan{' '}
                    <span className="font-medium">1</span> - <span className="font-medium">{filteredUsers.length}</span> arası gösteriliyor
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Önceki
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      Sonraki
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 