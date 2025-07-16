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
import { CreditCard, DollarSign, Users, Calendar, Plus, Search, TrendingUp, AlertCircle } from 'lucide-react'

interface Subscription {
  id: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  planId: string
  status: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
  plan: {
    id: string
    name: string
    description?: string
    price: number
    currency: string
    interval: string
    features: string
  }
  payments: Array<{
    id: string
    amount: number
    currency: string
    status: string
    createdAt: string
  }>
}

interface Plan {
  id: string
  name: string
  description?: string
  stripePriceId?: string
  price: number
  currency: string
  interval: string
  features: string
  isActive: boolean
  _count: {
    subscriptions: number
  }
}

interface Payment {
  id: string
  subscriptionId: string
  stripePaymentId?: string
  amount: number
  currency: string
  status: string
  paymentMethod?: string
  failureReason?: string
  createdAt: string
  subscription: {
    id: string
    plan: {
      name: string
    }
  }
}

export default function BillingPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCreatePlanDialog, setShowCreatePlanDialog] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    interval: 'MONTH',
    features: [] as string[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [subscriptionsRes, plansRes, paymentsRes] = await Promise.all([
        fetch('/api/billing'),
        fetch('/api/billing/plans'),
        fetch('/api/billing/payments'),
      ])

      const subscriptionsData = await subscriptionsRes.json()
      const plansData = await plansRes.json()
      const paymentsData = await paymentsRes.json()

      setSubscriptions(subscriptionsData.subscriptions || [])
      setPlans(plansData.plans || [])
      setPayments(paymentsData.payments || [])
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async () => {
    try {
      const response = await fetch('/api/billing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          price: parseFloat(newPlan.price),
          features: JSON.stringify(newPlan.features),
        }),
      })

      if (response.ok) {
        setShowCreatePlanDialog(false)
        setNewPlan({
          name: '',
          description: '',
          price: '',
          currency: 'USD',
          interval: 'MONTH',
          features: [],
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating plan:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-800'
      case 'UNPAID': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const billingStats = {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'ACTIVE').length,
    totalRevenue: payments
      .filter(p => p.status === 'SUCCEEDED')
      .reduce((sum, p) => sum + p.amount, 0),
    monthlyRevenue: payments
      .filter(p => p.status === 'SUCCEEDED' && 
        new Date(p.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .reduce((sum, p) => sum + p.amount, 0),
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Faturalandırma</h1>
              <p className="text-gray-600">Abonelik ve ödeme yönetimi</p>
            </div>
            <Dialog open={showCreatePlanDialog} onOpenChange={setShowCreatePlanDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Yeni Abonelik Planı Oluştur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Plan Adı</label>
                    <Input
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="Pro Plan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Açıklama</label>
                    <Textarea
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      placeholder="Plan açıklaması"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Fiyat</label>
                      <Input
                        type="number"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                        placeholder="29.99"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Para Birimi</label>
                      <Select value={newPlan.currency} onValueChange={(value) => setNewPlan({ ...newPlan, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="TRY">TRY</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Periyot</label>
                      <Select value={newPlan.interval} onValueChange={(value) => setNewPlan({ ...newPlan, interval: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTH">Aylık</SelectItem>
                          <SelectItem value="YEAR">Yıllık</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreatePlanDialog(false)}>
                      İptal
                    </Button>
                    <Button onClick={createPlan}>
                      Oluştur
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
              <TabsTrigger value="subscriptions">Abonelikler</TabsTrigger>
              <TabsTrigger value="plans">Planlar</TabsTrigger>
              <TabsTrigger value="payments">Ödemeler</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Son Abonelikler</h3>
                  <div className="space-y-3">
                    {subscriptions.slice(0, 5).map((subscription) => (
                      <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{subscription.plan.name}</div>
                          <div className="text-sm text-gray-600">
                            ${subscription.plan.price}/{subscription.plan.interval === 'MONTH' ? 'ay' : 'yıl'}
                          </div>
                        </div>
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status === 'ACTIVE' && 'Aktif'}
                          {subscription.status === 'CANCELLED' && 'İptal'}
                          {subscription.status === 'PAST_DUE' && 'Gecikmiş'}
                          {subscription.status === 'UNPAID' && 'Ödenmemiş'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">Son Ödemeler</h3>
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">${payment.amount}</div>
                          <div className="text-sm text-gray-600">{payment.subscription.plan.name}</div>
                        </div>
                        <Badge className={getPaymentStatusColor(payment.status)}>
                          {payment.status === 'SUCCEEDED' && 'Başarılı'}
                          {payment.status === 'PENDING' && 'Beklemede'}
                          {payment.status === 'FAILED' && 'Başarısız'}
                          {payment.status === 'CANCELLED' && 'İptal'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="subscriptions">
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{subscription.plan.name}</h3>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status === 'ACTIVE' && 'Aktif'}
                            {subscription.status === 'CANCELLED' && 'İptal'}
                            {subscription.status === 'PAST_DUE' && 'Gecikmiş'}
                            {subscription.status === 'UNPAID' && 'Ödenmemiş'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{subscription.plan.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${subscription.plan.price}/{subscription.plan.interval === 'MONTH' ? 'ay' : 'yıl'}
                          </div>
                          {subscription.currentPeriodEnd && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            {subscription.payments.length} ödeme
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Detaylar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="plans">
              <div className="space-y-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{plan.name}</h3>
                          <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                            {plan.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${plan.price}/{plan.interval === 'MONTH' ? 'ay' : 'yıl'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {plan._count.subscriptions} abonelik
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Düzenle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">${payment.amount} {payment.currency}</h3>
                          <Badge className={getPaymentStatusColor(payment.status)}>
                            {payment.status === 'SUCCEEDED' && 'Başarılı'}
                            {payment.status === 'PENDING' && 'Beklemede'}
                            {payment.status === 'FAILED' && 'Başarısız'}
                            {payment.status === 'CANCELLED' && 'İptal'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{payment.subscription.plan.name}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(payment.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          {payment.paymentMethod && (
                            <div className="flex items-center gap-1">
                              <CreditCard className="w-4 h-4" />
                              {payment.paymentMethod}
                            </div>
                          )}
                          {payment.failureReason && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              {payment.failureReason}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Detaylar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 