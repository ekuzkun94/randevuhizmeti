'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  DollarSign,
  User,
  FileText,
  Calendar
} from 'lucide-react'

interface Quote {
  id: string
  quoteNumber: string
  title: string
  description?: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: string
  subtotal: number
  taxRate: number
  taxAmount: number
  discountRate: number
  discountAmount: number
  total: number
  status: string
  validUntil?: string
  notes?: string
  terms?: string
  items: QuoteItem[]
}

interface QuoteItem {
  id: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  total: number
  order: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
}

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  quote?: Quote | null
  mode: 'create' | 'edit'
  onSuccess: () => void
}

export function QuoteModal({ isOpen, onClose, quote, mode, onSuccess }: QuoteModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    taxRate: 0,
    discountRate: 0,
    validUntil: '',
    notes: '',
    terms: ''
  })
  
  const [items, setItems] = useState<Omit<QuoteItem, 'id'>[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCustomers()
      if (quote && mode === 'edit') {
        setFormData({
          title: quote.title,
          description: quote.description || '',
          customerId: quote.customerId,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone || '',
          customerAddress: quote.customerAddress || '',
          taxRate: quote.taxRate,
          discountRate: quote.discountRate,
          validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
          notes: quote.notes || '',
          terms: quote.terms || ''
        })
        setItems(quote.items.map(item => ({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          order: item.order
        })))
      } else {
        resetForm()
      }
    }
  }, [isOpen, quote, mode])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      customerId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      taxRate: 0,
      discountRate: 0,
      validUntil: '',
      notes: '',
      terms: ''
    })
    setItems([])
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || ''
      }))
    }
  }

  const addItem = () => {
    const newItem: Omit<QuoteItem, 'id'> = {
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      order: items.length
    }
    setItems([...items, newItem])
  }

  const updateItem = (index: number, field: keyof Omit<QuoteItem, 'id'>, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Calculate total for the item
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
    }
    
    setItems(updatedItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (formData.taxRate / 100)
    const discountAmount = subtotal * (formData.discountRate / 100)
    const total = subtotal + taxAmount - discountAmount
    
    return { subtotal, taxAmount, discountAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.customerName || items.length === 0) {
      toast.error('Lütfen gerekli alanları doldurun')
      return
    }

    setLoading(true)
    
    try {
      const { subtotal, taxAmount, discountAmount, total } = calculateTotals()
      
      const quoteData = {
        ...formData,
        subtotal,
        taxAmount,
        discountAmount,
        total,
        items: items.map((item, index) => ({
          ...item,
          order: index
        }))
      }

      const url = mode === 'create' ? '/api/quotes' : `/api/quotes/${quote?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteData)
      })

      if (response.ok) {
        toast.success(
          mode === 'create' 
            ? 'Teklif başarıyla oluşturuldu' 
            : 'Teklif başarıyla güncellendi'
        )
        onSuccess()
      } else {
        const error = await response.json()
        toast.error(error.error || 'İşlem sırasında hata oluştu')
      }
    } catch (error) {
      console.error('Error saving quote:', error)
      toast.error('İşlem sırasında hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {mode === 'create' ? 'Yeni Teklif Oluştur' : 'Teklifi Düzenle'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <FileText className="w-5 h-5" />
                    Temel Bilgiler
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Teklif Başlığı *</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Teklif başlığını girin"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Geçerlilik Tarihi</label>
                      <Input
                        type="date"
                        value={formData.validUntil}
                        onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Açıklama</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Teklif açıklaması"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <User className="w-5 h-5" />
                    Müşteri Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Müşteri Seçin</label>
                    <Select value={formData.customerId} onValueChange={handleCustomerChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Müşteri seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Müşteri Adı *</label>
                      <Input
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Müşteri adı"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">E-posta *</label>
                      <Input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="musteri@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Telefon</label>
                      <Input
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+90 555 123 4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Adres</label>
                      <Input
                        value={formData.customerAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                        placeholder="Müşteri adresi"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quote Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-gray-800">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Teklif Kalemleri
                    </div>
                    <Button
                      type="button"
                      onClick={addItem}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                    >
                      <Plus className="w-4 h-4" />
                      Kalem Ekle
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800">Kalem {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Ürün/Hizmet Adı *</label>
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            placeholder="Ürün veya hizmet adı"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Açıklama</label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Açıklama"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Miktar</label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Birim Fiyat (₺)</label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Toplam (₺)</label>
                          <Input
                            value={item.total.toFixed(2)}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {items.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Henüz kalem eklenmemiş. Teklif oluşturmak için kalem ekleyin.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <DollarSign className="w-5 h-5" />
                    Fiyatlandırma
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">KDV Oranı (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.taxRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">İndirim Oranı (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discountRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, discountRate: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ara Toplam:</span>
                      <span className="font-medium">₺{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">KDV ({formData.taxRate}%):</span>
                      <span className="font-medium">₺{taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">İndirim ({formData.discountRate}%):</span>
                      <span className="font-medium text-red-600">-₺{discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between">
                      <span className="font-semibold text-gray-800">Genel Toplam:</span>
                      <span className="font-bold text-lg text-gray-800">₺{total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <FileText className="w-5 h-5" />
                    Ek Bilgiler
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Notlar</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Teklif notları"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Şartlar ve Koşullar</label>
                    <Textarea
                      value={formData.terms}
                      onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                      placeholder="Şartlar ve koşullar"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Kaydediliyor...' : (mode === 'create' ? 'Teklif Oluştur' : 'Teklifi Güncelle')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 