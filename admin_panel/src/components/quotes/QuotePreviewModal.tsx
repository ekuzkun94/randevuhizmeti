'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  X, 
  Download, 
  Send, 
  FileText, 
  User, 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Send as SendIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Quote {
  id: string
  quoteNumber: string
  title: string
  description?: string
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
  sentAt?: string
  acceptedAt?: string
  rejectedAt?: string
  notes?: string
  terms?: string
  createdAt: string
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

interface QuotePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  quote: Quote
  onGeneratePDF: () => void
}

export function QuotePreviewModal({ isOpen, onClose, quote, onGeneratePDF }: QuotePreviewModalProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary'
      case 'SENT':
        return 'default'
      case 'ACCEPTED':
        return 'success'
      case 'REJECTED':
        return 'destructive'
      case 'EXPIRED':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-4 h-4" />
      case 'SENT':
        return <SendIcon className="w-4 h-4" />
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4" />
      case 'EXPIRED':
        return <Clock className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Taslak'
      case 'SENT':
        return 'Gönderildi'
      case 'ACCEPTED':
        return 'Kabul Edildi'
      case 'REJECTED':
        return 'Reddedildi'
      case 'EXPIRED':
        return 'Süresi Doldu'
      default:
        return status
    }
  }

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
                  Teklif Önizleme
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGeneratePDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF İndir
                  </Button>
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
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{quote.title}</h1>
                    {quote.description && (
                      <p className="text-gray-600 mt-1">{quote.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Teklif No</div>
                    <div className="font-mono text-lg font-bold text-gray-900">{quote.quoteNumber}</div>
                    <Badge variant={getStatusBadgeVariant(quote.status) as any} className="mt-2">
                      <div className="flex items-center gap-1">
                        {getStatusIcon(quote.status)}
                        {getStatusText(quote.status)}
                      </div>
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Müşteri Bilgileri
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="font-medium">{quote.customerName}</div>
                      <div className="text-gray-600">{quote.customerEmail}</div>
                      {quote.customerPhone && (
                        <div className="text-gray-600">{quote.customerPhone}</div>
                      )}
                      {quote.customerAddress && (
                        <div className="text-gray-600">{quote.customerAddress}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Tarih Bilgileri
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Oluşturulma:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(quote.createdAt), 'dd/MM/yyyy', { locale: tr })}
                        </span>
                      </div>
                      {quote.validUntil && (
                        <div>
                          <span className="text-gray-600">Geçerlilik:</span>
                          <span className="ml-2 font-medium">
                            {format(new Date(quote.validUntil), 'dd/MM/yyyy', { locale: tr })}
                          </span>
                        </div>
                      )}
                      {quote.sentAt && (
                        <div>
                          <span className="text-gray-600">Gönderilme:</span>
                          <span className="ml-2 font-medium">
                            {format(new Date(quote.sentAt), 'dd/MM/yyyy', { locale: tr })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Teklif Kalemleri
                </h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ürün/Hizmet</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Açıklama</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Miktar</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Birim Fiyat</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {quote.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            ₺{item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            ₺{item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ara Toplam:</span>
                    <span className="font-medium">₺{quote.subtotal.toFixed(2)}</span>
                  </div>
                  {quote.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">KDV ({quote.taxRate}%):</span>
                      <span className="font-medium">₺{quote.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {quote.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">İndirim ({quote.discountRate}%):</span>
                      <span className="font-medium text-red-600">-₺{quote.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-800">Genel Toplam:</span>
                    <span className="font-bold text-lg text-gray-800">₺{quote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              {(quote.notes || quote.terms) && (
                <div className="space-y-4">
                  {quote.notes && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Notlar</h3>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                        {quote.notes}
                      </div>
                    </div>
                  )}
                  
                  {quote.terms && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Şartlar ve Koşullar</h3>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                        {quote.terms}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Kapat
                </Button>
                <Button
                  onClick={onGeneratePDF}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600 text-white"
                >
                  <Download className="w-4 h-4" />
                  PDF İndir
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 