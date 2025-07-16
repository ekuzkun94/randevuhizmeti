'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Switch } from '@/components/ui/Switch'
import { Plus, Settings, Users, FileText, Tag, Database, Search } from 'lucide-react'

interface CustomField {
  id: string
  name: string
  label: string
  type: string
  entityType: string
  isRequired: boolean
  isUnique: boolean
  options?: string
  createdAt: string
  updatedAt: string
  _count: {
    values: number
  }
}

export default function CustomFieldsPage() {
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'TEXT',
    entityType: 'USER',
    isRequired: false,
    isUnique: false,
    options: [] as string[],
  })

  useEffect(() => {
    fetchCustomFields()
  }, [activeTab])

  const fetchCustomFields = async () => {
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.append('entityType', activeTab)

      const response = await fetch(`/api/custom-fields?${params}`)
      const data = await response.json()
      setCustomFields(data.customFields || [])
    } catch (error) {
      console.error('Error fetching custom fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCustomField = async () => {
    try {
      const response = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newField,
          options: newField.options.length > 0 ? newField.options : null,
        }),
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setNewField({
          name: '',
          label: '',
          type: 'TEXT',
          entityType: 'USER',
          isRequired: false,
          isUnique: false,
          options: [],
        })
        fetchCustomFields()
      }
    } catch (error) {
      console.error('Error creating custom field:', error)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TEXT': return 'bg-blue-100 text-blue-800'
      case 'NUMBER': return 'bg-green-100 text-green-800'
      case 'EMAIL': return 'bg-purple-100 text-purple-800'
      case 'PHONE': return 'bg-orange-100 text-orange-800'
      case 'DATE': return 'bg-red-100 text-red-800'
      case 'SELECT': return 'bg-yellow-100 text-yellow-800'
      case 'MULTISELECT': return 'bg-indigo-100 text-indigo-800'
      case 'BOOLEAN': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'USER': return <Users className="w-4 h-4" />
      case 'CONTENT': return <FileText className="w-4 h-4" />
      case 'TASK': return <Tag className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const filteredFields = customFields.filter(field => 
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fieldStats = {
    total: customFields.length,
    user: customFields.filter(f => f.entityType === 'USER').length,
    content: customFields.filter(f => f.entityType === 'CONTENT').length,
    task: customFields.filter(f => f.entityType === 'TASK').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Özel Alanlar</h1>
          <p className="text-gray-600">Dinamik alan yönetimi ve özelleştirme</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Alan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Özel Alan Oluştur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Alan Adı</label>
                  <Input
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    placeholder="phone_number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Görünen Ad</label>
                  <Input
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="Telefon Numarası"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Alan Tipi</label>
                  <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Metin</SelectItem>
                      <SelectItem value="NUMBER">Sayı</SelectItem>
                      <SelectItem value="EMAIL">E-posta</SelectItem>
                      <SelectItem value="PHONE">Telefon</SelectItem>
                      <SelectItem value="DATE">Tarih</SelectItem>
                      <SelectItem value="SELECT">Seçim</SelectItem>
                      <SelectItem value="MULTISELECT">Çoklu Seçim</SelectItem>
                      <SelectItem value="BOOLEAN">Evet/Hayır</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Varlık Tipi</label>
                  <Select value={newField.entityType} onValueChange={(value) => setNewField({ ...newField, entityType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Kullanıcı</SelectItem>
                      <SelectItem value="CONTENT">İçerik</SelectItem>
                      <SelectItem value="TASK">Görev</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newField.isRequired}
                    onCheckedChange={(checked) => setNewField({ ...newField, isRequired: checked })}
                  />
                  <label className="text-sm font-medium">Zorunlu Alan</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newField.isUnique}
                    onCheckedChange={(checked) => setNewField({ ...newField, isUnique: checked })}
                  />
                  <label className="text-sm font-medium">Benzersiz Değer</label>
                </div>
              </div>
              {(newField.type === 'SELECT' || newField.type === 'MULTISELECT') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Seçenekler (her satıra bir seçenek)</label>
                  <Textarea
                    value={newField.options.join('\n')}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value.split('\n').filter(opt => opt.trim()) })}
                    placeholder="Seçenek 1&#10;Seçenek 2&#10;Seçenek 3"
                    rows={4}
                  />
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  İptal
                </Button>
                <Button onClick={createCustomField}>
                  Oluştur
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{fieldStats.total}</div>
            <div className="text-sm text-gray-600">Toplam Alan</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{fieldStats.user}</div>
            <div className="text-sm text-gray-600">Kullanıcı Alanları</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{fieldStats.content}</div>
            <div className="text-sm text-gray-600">İçerik Alanları</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{fieldStats.task}</div>
            <div className="text-sm text-gray-600">Görev Alanları</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Alan ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Tüm Alanlar</TabsTrigger>
              <TabsTrigger value="USER">Kullanıcı</TabsTrigger>
              <TabsTrigger value="CONTENT">İçerik</TabsTrigger>
              <TabsTrigger value="TASK">Görev</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Yükleniyor...</div>
          ) : filteredFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Özel alan bulunamadı</div>
          ) : (
            <div className="space-y-4">
              {filteredFields.map((field) => (
                <div key={field.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getEntityTypeIcon(field.entityType)}
                        <h3 className="font-semibold">{field.label}</h3>
                        <Badge className={getTypeColor(field.type)}>
                          {field.type === 'TEXT' && 'Metin'}
                          {field.type === 'NUMBER' && 'Sayı'}
                          {field.type === 'EMAIL' && 'E-posta'}
                          {field.type === 'PHONE' && 'Telefon'}
                          {field.type === 'DATE' && 'Tarih'}
                          {field.type === 'SELECT' && 'Seçim'}
                          {field.type === 'MULTISELECT' && 'Çoklu Seçim'}
                          {field.type === 'BOOLEAN' && 'Evet/Hayır'}
                        </Badge>
                        {field.isRequired && (
                          <Badge variant="destructive">Zorunlu</Badge>
                        )}
                        {field.isUnique && (
                          <Badge variant="secondary">Benzersiz</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        <code className="bg-gray-100 px-1 rounded">{field.name}</code>
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Settings className="w-4 h-4" />
                          {field._count.values} değer
                        </div>
                        <div>
                          {new Date(field.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      {field.options && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">Seçenekler:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {JSON.parse(field.options).map((option: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Düzenle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 