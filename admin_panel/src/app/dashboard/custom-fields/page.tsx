'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Switch } from '@/components/ui/Switch'
import { PageHeader } from '@/components/ui/PageHeader'
import { Plus, Settings, Users, FileText, Tag, Database, Search, Files } from 'lucide-react'

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
      case 'TEXT': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'NUMBER': return 'bg-green-100 text-green-800 border-green-200'
      case 'EMAIL': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'PHONE': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'DATE': return 'bg-red-100 text-red-800 border-red-200'
      case 'SELECT': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'MULTISELECT': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'BOOLEAN': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'USER': return <Users className="w-4 h-4 text-blue-600" />
      case 'CONTENT': return <FileText className="w-4 h-4 text-orange-600" />
      case 'TASK': return <Tag className="w-4 h-4 text-blue-600" />
      default: return <Database className="w-4 h-4 text-gray-600" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Özel Alanlar"
        description="Dinamik alan yönetimi ve özelleştirme"
        icon={<Files className="w-6 h-6" />}
        actions={
          <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
            <Plus size={16} className="mr-2" />
            Yeni Alan
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Toplam Alan</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {fieldStats.total}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <Files className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Kullanıcı Alanları</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    {fieldStats.user}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">İçerik Alanları</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {fieldStats.content}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Görev Alanları</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    {fieldStats.task}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                  <Tag className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Alan ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Custom Fields List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Tüm Alanlar
                </TabsTrigger>
                <TabsTrigger 
                  value="USER"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Kullanıcı
                </TabsTrigger>
                <TabsTrigger 
                  value="CONTENT"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  İçerik
                </TabsTrigger>
                <TabsTrigger 
                  value="TASK"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Görev
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Özel alan bulunamadı</div>
            ) : (
              <div className="space-y-4">
                {filteredFields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          {getEntityTypeIcon(field.entityType)}
                          <h3 className="font-semibold text-gray-800">{field.label}</h3>
                          <Badge className={`${getTypeColor(field.type)} border`}>
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
                            <Badge variant="destructive" className="border">Zorunlu</Badge>
                          )}
                          {field.isUnique && (
                            <Badge variant="secondary" className="border">Benzersiz</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                          <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">{field.name}</code>
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-600" />
                            {field._count.values} değer
                          </div>
                          <div>
                            {new Date(field.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        {field.options && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Seçenekler:</p>
                            <div className="flex flex-wrap gap-2">
                              {JSON.parse(field.options).map((option: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs border-gray-200">
                                  {option}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                        Düzenle
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Field Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Yeni Özel Alan Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Alan Adı</label>
                <Input
                  value={newField.name}
                  onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                  placeholder="phone_number"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Görünen Ad</label>
                <Input
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="Telefon Numarası"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Alan Tipi</label>
                <Select value={newField.type} onValueChange={(value) => setNewField({ ...newField, type: value })}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                <label className="block text-sm font-medium mb-2 text-gray-700">Varlık Tipi</label>
                <Select value={newField.entityType} onValueChange={(value) => setNewField({ ...newField, entityType: value })}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newField.isRequired}
                  onCheckedChange={(checked) => setNewField({ ...newField, isRequired: checked })}
                />
                <label className="text-sm font-medium text-gray-700">Zorunlu Alan</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newField.isUnique}
                  onCheckedChange={(checked) => setNewField({ ...newField, isUnique: checked })}
                />
                <label className="text-sm font-medium text-gray-700">Benzersiz Değer</label>
              </div>
            </div>
            {(newField.type === 'SELECT' || newField.type === 'MULTISELECT') && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Seçenekler (her satıra bir seçenek)</label>
                <Textarea
                  value={newField.options.join('\n')}
                  onChange={(e) => setNewField({ ...newField, options: e.target.value.split('\n').filter(opt => opt.trim()) })}
                  placeholder="Seçenek 1&#10;Seçenek 2&#10;Seçenek 3"
                  rows={4}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                İptal
              </Button>
              <Button 
                onClick={createCustomField}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 