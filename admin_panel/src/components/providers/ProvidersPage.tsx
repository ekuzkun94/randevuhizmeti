'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProviderTable } from './ProviderTable'
import { ProviderModal } from './ProviderModal'

interface Provider {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: search
      })
      
      const response = await fetch(`/api/providers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProviders()
  }, [currentPage, search])

  const handleCreate = () => {
    setEditingProvider(null)
    setShowModal(true)
  }

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingProvider(null)
    fetchProviders()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hizmet Sağlayıcıları</h1>
          <p className="text-gray-600 mt-1">Hizmet sağlayıcılarını yönetin ve takip edin</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Yeni Hizmet Sağlayıcı</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Hizmet sağlayıcı ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filtrele</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hizmet Sağlayıcıları Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <ProviderTable
            providers={providers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={fetchProviders}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <ProviderModal
          provider={editingProvider}
          onClose={handleModalClose}
        />
      )}
    </div>
  )
} 