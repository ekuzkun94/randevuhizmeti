'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { 
  Upload, 
  Download, 
  Trash2, 
  Eye, 
  Copy,
  Search,
  Folder,
  File,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Globe,
  Lock
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

interface FileItem {
  id: string
  name: string
  originalName: string
  mimeType: string
  size: number
  path: string
  url?: string
  isPublic: boolean
  createdAt: string
}

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        search
      })

      const response = await fetch(`/api/files?${params}`)
      const data = await response.json()

      if (response.ok) {
        setFiles(data.files)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Dosyalar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [page, search])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('isPublic', isPublic.toString())

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Dosya başarıyla yüklendi')
        setIsUploadModalOpen(false)
        setSelectedFile(null)
        setIsPublic(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        fetchFiles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Dosya yüklenirken hata oluştu')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Dosya yüklenirken hata oluştu')
    } finally {
      setUploading(false)
    }
  }

  const deleteFile = async (id: string) => {
    if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/files/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFiles(prev => prev.filter(file => file.id !== id))
        toast.success('Dosya silindi')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Dosya silinirken hata oluştu')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Dosya silinirken hata oluştu')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('URL panoya kopyalandı')
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Kopyalama işlemi başarısız')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6" />
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6" />
    if (mimeType.startsWith('audio/')) return <Music className="h-6 w-6" />
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-6 w-6" />
    if (mimeType.includes('pdf') || mimeType.includes('text/')) return <FileText className="h-6 w-6" />
    return <File className="h-6 w-6" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dosya Yönetimi</h1>
          <p className="text-muted-foreground">
            Dosyalarınızı yükleyin ve yönetin
          </p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="flex items-center space-x-2">
          <Upload className="h-4 w-4" />
          <span>Dosya Yükle</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Dosya ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file.mimeType)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm truncate">{file.name}</CardTitle>
                      </div>
                    </div>
                    {file.isPublic ? (
                      <Globe className="h-4 w-4 text-green-600" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-gray-500">
                    <div>Boyut: {formatFileSize(file.size)}</div>
                    <div>Yüklenme: {format(new Date(file.createdAt), 'dd MMM yyyy', { locale: tr })}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {file.mimeType.split('/')[1]?.toUpperCase() || 'DOSYA'}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {file.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      {file.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(file.url!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFile(file.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {files.length === 0 && (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Dosya bulunamadı
          </h3>
          <p className="text-gray-500 mb-4">
            İlk dosyanızı yüklemek için yukarıdaki butona tıklayın
          </p>
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            İlk Dosyayı Yükle
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Sayfa {page} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Sonraki
            </Button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Dosya Yükle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dosya Seç</label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm">
                Herkese açık yap
              </label>
            </div>

            {selectedFile && (
              <div className="text-sm text-gray-600">
                <div>Dosya: {selectedFile.name}</div>
                <div>Boyut: {formatFileSize(selectedFile.size)}</div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                İptal
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Yükleniyor...' : 'Yükle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 