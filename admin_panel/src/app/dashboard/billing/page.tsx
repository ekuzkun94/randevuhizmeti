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
import { PageHeader } from '@/components/ui/PageHeader'
import { CreditCard, DollarSign, Users, Calendar, Plus, Search, TrendingUp, AlertCircle, Receipt } from 'lucide-react'

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
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'UNPAID': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCEEDED': return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faturalandırma"
        description="Abonelik ve ödeme yönetimi"
        icon={<Receipt className="w-6 h-6" />}
        actions={
          <Button onClick={() => setShowCreatePlanDialog(true)} className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
            <Plus size={16} className="mr-2" />
            Yeni Plan
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
                  <p className="text-sm text-gray-600 mb-1">Toplam Abonelik</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    {billingStats.totalSubscriptions}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <Users className="w-6 h-6 text-blue-600" />
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
                  <p className="text-sm text-gray-600 mb-1">Aktif Abonelik</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    {billingStats.activeSubscriptions}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                  <CreditCard className="w-6 h-6 text-orange-600" />
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
                  <p className="text-sm text-gray-600 mb-1">Toplam Gelir</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    ${billingStats.totalRevenue}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
                  <DollarSign className="w-6 h-6 text-blue-600" />
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
                  <p className="text-sm text-gray-600 mb-1">Aylık Gelir</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                    ${billingStats.monthlyRevenue}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Genel Bakış
                </TabsTrigger>
                <TabsTrigger 
                  value="subscriptions"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Abonelikler
                </TabsTrigger>
                <TabsTrigger 
                  value="plans"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Planlar
                </TabsTrigger>
                <TabsTrigger 
                  value="payments"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  Ödemeler
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Son Abonelikler</h3>
                    <div className="space-y-3">
                      {subscriptions.slice(0, 5).map((subscription, index) => (
                        <motion.div
                          key={subscription.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50 transition-all duration-300"
                        >
                          <div>
                            <div className="font-medium text-gray-800">{subscription.plan.name}</div>
                            <div className="text-sm text-gray-600">
                              ${subscription.plan.price}/{subscription.plan.interval === 'MONTH' ? 'ay' : 'yıl'}
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(subscription.status)} border`}>
                            {subscription.status === 'ACTIVE' && 'Aktif'}
                            {subscription.status === 'CANCELLED' && 'İptal'}
                            {subscription.status === 'PAST_DUE' && 'Gecikmiş'}
                            {subscription.status === 'UNPAID' && 'Ödenmemiş'}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Son Ödemeler</h3>
                    <div className="space-y-3">
                      {payments.slice(0, 5).map((payment, index) => (
                        <motion.div
                          key={payment.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50 transition-all duration-300"
                        >
                          <div>
                            <div className="font-medium text-gray-800">${payment.amount}</div>
                            <div className="text-sm text-gray-600">{payment.subscription.plan.name}</div>
                          </div>
                          <Badge className={`${getPaymentStatusColor(payment.status)} border`}>
                            {payment.status === 'SUCCEEDED' && 'Başarılı'}
                            {payment.status === 'PENDING' && 'Beklemede'}
                            {payment.status === 'FAILED' && 'Başarısız'}
                            {payment.status === 'CANCELLED' && 'İptal'}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subscriptions" className="space-y-4 mt-6">
                {subscriptions.map((subscription, index) => (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-gray-800">{subscription.plan.name}</h3>
                          <Badge className={`${getStatusColor(subscription.status)} border`}>
                            {subscription.status === 'ACTIVE' && 'Aktif'}
                            {subscription.status === 'CANCELLED' && 'İptal'}
                            {subscription.status === 'PAST_DUE' && 'Gecikmiş'}
                            {subscription.status === 'UNPAID' && 'Ödenmemiş'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{subscription.plan.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            ${subscription.plan.price}/{subscription.plan.interval === 'MONTH' ? 'ay' : 'yıl'}
                          </div>
                          {subscription.currentPeriodEnd && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-orange-600" />
                              {new Date(subscription.currentPeriodEnd).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            {subscription.payments.length} ödeme
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        Detaylar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="plans" className="space-y-4 mt-6">
                {plans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-gray-800">{plan.name}</h3>
                          <Badge variant={plan.isActive ? 'default' : 'secondary'} className="border">
                            {plan.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            ${plan.price}/{plan.interval === 'MONTH' ? 'ay' : 'yıl'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-600" />
                            {plan._count.subscriptions} abonelik
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-orange-200 text-orange-600 hover:bg-orange-50">
                        Düzenle
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4 mt-6">
                {payments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-gray-800">${payment.amount} {payment.currency}</h3>
                          <Badge className={`${getPaymentStatusColor(payment.status)} border`}>
                            {payment.status === 'SUCCEEDED' && 'Başarılı'}
                            {payment.status === 'PENDING' && 'Beklemede'}
                            {payment.status === 'FAILED' && 'Başarısız'}
                            {payment.status === 'CANCELLED' && 'İptal'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{payment.subscription.plan.name}</p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            {new Date(payment.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          {payment.paymentMethod && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-orange-600" />
                              {payment.paymentMethod}
                            </div>
                          )}
                          {payment.failureReason && (
                            <div className="flex items-center gap-2 text-red-600">
                              <AlertCircle className="w-4 h-4" />
                              {payment.failureReason}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        Detaylar
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Plan Dialog */}
      <Dialog open={showCreatePlanDialog} onOpenChange={setShowCreatePlanDialog}>
        <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Yeni Abonelik Planı Oluştur</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Plan Adı</label>
              <Input
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="Pro Plan"
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Açıklama</label>
              <Textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                placeholder="Plan açıklaması"
                rows={3}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Fiyat</label>
                <Input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                  placeholder="29.99"
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Para Birimi</label>
                <Select value={newPlan.currency} onValueChange={(value) => setNewPlan({ ...newPlan, currency: value })}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                <label className="block text-sm font-medium mb-2 text-gray-700">Periyot</label>
                <Select value={newPlan.interval} onValueChange={(value) => setNewPlan({ ...newPlan, interval: value })}>
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTH">Aylık</SelectItem>
                    <SelectItem value="YEAR">Yıllık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreatePlanDialog(false)}
                className="border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                İptal
              </Button>
              <Button 
                onClick={createPlan}
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