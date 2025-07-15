'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from 'next-auth/react'
import { Plus, Tag, MessageSquare, Eye, EyeOff, Edit, Trash2 } from 'lucide-react'

interface Annotation {
  id: string
  entityType: string
  entityId: string
  content: string
  type: 'NOTE' | 'WARNING' | 'INFO' | 'TODO'
  isPrivate: boolean
  createdAt: string
  author: {
    id: string
    name: string
    email: string
  }
  tags: Array<{
    id: string
    name: string
    color: string
  }>
}

interface Tag {
  id: string
  name: string
  color: string
  description?: string
  isSystem: boolean
  _count: {
    annotations: number
    users: number
    taskTags: number
  }
}

export default function AnnotationsPage() {
  const { data: session } = useSession()
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateAnnotation, setShowCreateAnnotation] = useState(false)
  const [showCreateTag, setShowCreateTag] = useState(false)
  
  // Form states
  const [newAnnotation, setNewAnnotation] = useState({
    entityType: '',
    entityId: '',
    content: '',
    type: 'NOTE' as const,
    isPrivate: false,
    tagIds: [] as string[]
  })
  
  const [newTag, setNewTag] = useState({
    name: '',
    color: '#3B82F6',
    description: ''
  })

  useEffect(() => {
    fetchAnnotations()
    fetchTags()
  }, [])

  const fetchAnnotations = async () => {
    try {
      const response = await fetch('/api/annotations')
      if (response.ok) {
        const data = await response.json()
        setAnnotations(data.annotations)
      }
    } catch (error) {
      console.error('Error fetching annotations:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAnnotation = async () => {
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnnotation)
      })

      if (response.ok) {
        setShowCreateAnnotation(false)
        setNewAnnotation({
          entityType: '',
          entityId: '',
          content: '',
          type: 'NOTE',
          isPrivate: false,
          tagIds: []
        })
        fetchAnnotations()
      }
    } catch (error) {
      console.error('Error creating annotation:', error)
    }
  }

  const createTag = async () => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag)
      })

      if (response.ok) {
        setShowCreateTag(false)
        setNewTag({
          name: '',
          color: '#3B82F6',
          description: ''
        })
        fetchTags()
      }
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'NOTE': return <MessageSquare className="w-4 h-4" />
      case 'WARNING': return <MessageSquare className="w-4 h-4 text-yellow-500" />
      case 'INFO': return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'TODO': return <MessageSquare className="w-4 h-4 text-green-500" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notlar & Etiketler</h1>
          <p className="text-muted-foreground">
            Kullanıcılar ve içerikler için notlar ekleyin, etiketler oluşturun
          </p>
        </div>
      </div>

      <Tabs defaultValue="annotations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="annotations">Notlar</TabsTrigger>
          <TabsTrigger value="tags">Etiketler</TabsTrigger>
        </TabsList>

        <TabsContent value="annotations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Notlar</h2>
            <Dialog open={showCreateAnnotation} onOpenChange={setShowCreateAnnotation}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Not Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Not Ekle</DialogTitle>
                  <DialogDescription>
                    Bir kullanıcı veya içerik için not ekleyin
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Varlık Tipi</label>
                    <Select value={newAnnotation.entityType} onValueChange={(value) => setNewAnnotation({...newAnnotation, entityType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Varlık tipi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Kullanıcı</SelectItem>
                        <SelectItem value="CONTENT">İçerik</SelectItem>
                        <SelectItem value="TASK">Görev</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Varlık ID</label>
                    <Input
                      placeholder="Varlık ID'si"
                      value={newAnnotation.entityId}
                      onChange={(e) => setNewAnnotation({...newAnnotation, entityId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Not Tipi</label>
                    <Select value={newAnnotation.type} onValueChange={(value: any) => setNewAnnotation({...newAnnotation, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOTE">Not</SelectItem>
                        <SelectItem value="WARNING">Uyarı</SelectItem>
                        <SelectItem value="INFO">Bilgi</SelectItem>
                        <SelectItem value="TODO">Yapılacak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">İçerik</label>
                    <Textarea
                      placeholder="Not içeriği..."
                      value={newAnnotation.content}
                      onChange={(e) => setNewAnnotation({...newAnnotation, content: e.target.value})}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={newAnnotation.isPrivate}
                      onChange={(e) => setNewAnnotation({...newAnnotation, isPrivate: e.target.checked})}
                    />
                    <label htmlFor="isPrivate" className="text-sm">Özel not</label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateAnnotation(false)}>
                      İptal
                    </Button>
                    <Button onClick={createAnnotation}>
                      Not Ekle
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {annotations.map((annotation) => (
              <Card key={annotation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(annotation.type)}
                      <Badge variant={annotation.type === 'WARNING' ? 'destructive' : 'secondary'}>
                        {annotation.type}
                      </Badge>
                      {annotation.isPrivate && (
                        <Badge variant="outline">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Özel
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(annotation.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <CardTitle className="text-sm">
                    {annotation.entityType}: {annotation.entityId}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{annotation.content}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {annotation.author.name}
                      </span>
                      {annotation.tags.map((tag) => (
                        <Badge key={tag.id} style={{ backgroundColor: tag.color, color: 'white' }}>
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tags" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Etiketler</h2>
            <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Etiket Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Etiket Oluştur</DialogTitle>
                  <DialogDescription>
                    Yeni bir etiket oluşturun
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Etiket Adı</label>
                    <Input
                      placeholder="Etiket adı"
                      value={newTag.name}
                      onChange={(e) => setNewTag({...newTag, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Renk</label>
                    <Input
                      type="color"
                      value={newTag.color}
                      onChange={(e) => setNewTag({...newTag, color: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Açıklama</label>
                    <Textarea
                      placeholder="Etiket açıklaması..."
                      value={newTag.description}
                      onChange={(e) => setNewTag({...newTag, description: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateTag(false)}>
                      İptal
                    </Button>
                    <Button onClick={createTag}>
                      Etiket Oluştur
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <Card key={tag.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: tag.color }}
                      />
                      <CardTitle className="text-sm">{tag.name}</CardTitle>
                    </div>
                    {tag.isSystem && (
                      <Badge variant="secondary">Sistem</Badge>
                    )}
                  </div>
                  {tag.description && (
                    <CardDescription className="text-xs">
                      {tag.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Notlar: {tag._count.annotations}</div>
                    <div>Kullanıcılar: {tag._count.users}</div>
                    <div>Görevler: {tag._count.taskTags}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 