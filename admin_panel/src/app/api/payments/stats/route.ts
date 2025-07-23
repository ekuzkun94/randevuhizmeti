import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method'); // Kredi kartı ödemeleri için

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Temel where koşulu
    const baseWhere: any = {};
    if (method) {
      baseWhere.paymentMethod = method;
    }

    // Tüm ödemeler
    const totalPayments = await prisma.appointmentPayment.count({ where: baseWhere });
    const totalAmount = await prisma.appointmentPayment.aggregate({
      _sum: { amount: true },
      where: baseWhere
    });

    // Durum bazında ödemeler
    const pendingPayments = await prisma.appointmentPayment.count({
      where: { ...baseWhere, status: 'PENDING' }
    });

    const paidPayments = await prisma.appointmentPayment.count({
      where: { ...baseWhere, status: 'PAID' }
    });

    const failedPayments = await prisma.appointmentPayment.count({
      where: { ...baseWhere, status: 'FAILED' }
    });

    const refundedPayments = await prisma.appointmentPayment.count({
      where: { ...baseWhere, status: 'REFUNDED' }
    });

    // Bugünkü ödemeler
    const todayPayments = await prisma.appointmentPayment.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: today
        }
      }
    });

    const todayAmount = await prisma.appointmentPayment.aggregate({
      _sum: { amount: true },
      where: {
        ...baseWhere,
        createdAt: {
          gte: today
        }
      }
    });

    // Bu ay ödemeler
    const monthlyPayments = await prisma.appointmentPayment.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    const monthlyAmount = await prisma.appointmentPayment.aggregate({
      _sum: { amount: true },
      where: {
        ...baseWhere,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Kredi kartı özel istatistikler
    let creditCardStats = {};
    if (method === 'CREDIT_CARD') {
      const averageInstallmentCount = await prisma.appointmentPayment.aggregate({
        _avg: { installmentCount: true },
        where: baseWhere
      });

      const totalInterestEarned = await prisma.appointmentPayment.aggregate({
        _sum: { interestRate: true },
        where: baseWhere
      });

      const cardTypeDistribution = await prisma.appointmentPayment.groupBy({
        by: ['cardType'],
        _count: { cardType: true },
        where: baseWhere
      });

      const installmentDistribution = await prisma.appointmentPayment.groupBy({
        by: ['installmentCount'],
        _count: { installmentCount: true },
        where: baseWhere
      });

      creditCardStats = {
        averageInstallmentCount: averageInstallmentCount._avg.installmentCount || 0,
        totalInterestEarned: totalInterestEarned._sum.interestRate || 0,
        cardTypeDistribution: {
          visa: cardTypeDistribution.find(d => d.cardType === 'Visa')?._count.cardType || 0,
          mastercard: cardTypeDistribution.find(d => d.cardType === 'Mastercard')?._count.cardType || 0,
          amex: cardTypeDistribution.find(d => d.cardType === 'American Express')?._count.cardType || 0,
          discover: cardTypeDistribution.find(d => d.cardType === 'Discover')?._count.cardType || 0
        },
        installmentDistribution: {
          single: installmentDistribution.find(d => d.installmentCount === 1)?._count.installmentCount || 0,
          multiple: installmentDistribution.filter(d => d.installmentCount > 1).reduce((sum, d) => sum + d._count.installmentCount, 0)
        }
      };
    }

    return NextResponse.json({
      totalPayments,
      totalAmount: totalAmount._sum.amount || 0,
      pendingPayments,
      paidPayments,
      failedPayments,
      refundedPayments,
      todayPayments,
      todayAmount: todayAmount._sum.amount || 0,
      monthlyPayments,
      monthlyAmount: monthlyAmount._sum.amount || 0,
      ...creditCardStats
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 