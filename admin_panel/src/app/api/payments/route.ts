import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditTrail } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const method = searchParams.get('method'); // Yeni parametre
    const customerId = searchParams.get('customerId');
    const employeeId = searchParams.get('employeeId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Filtreleri oluştur
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod;
    }
    
    // Method parametresi ile filtreleme (kredi kartı ödemeleri için)
    if (method && method !== 'all') {
      where.paymentMethod = method;
    }
    
    if (customerId && customerId !== 'all') {
      where.customerId = customerId;
    }
    
    if (employeeId && employeeId !== 'all') {
      where.employeeId = employeeId;
    }

    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Ödemeleri getir
    const [payments, total] = await Promise.all([
      prisma.appointmentPayment.findMany({
        where,
        include: {
          customer: {
            select: {
              name: true,
              email: true
            }
          },
          employee: {
            select: {
              name: true
            }
          },
          service: {
            select: {
              name: true,
              price: true
            }
          },
          appointment: {
            select: {
              start: true,
              end: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.appointmentPayment.count({ where })
    ]);

    return NextResponse.json({
      payments,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      appointmentId,
      customerId,
      employeeId,
      serviceId,
      amount,
      currency = 'TRY',
      status = 'PENDING',
      paymentMethod,
      transactionId,
      receiptNumber,
      notes,
      // Kredi kartı özel alanları
      cardNumber,
      cardHolderName,
      expiryMonth,
      expiryYear,
      cvv,
      installmentCount,
      installmentAmount,
      totalAmount,
      interestRate,
      bankName,
      cardType
    } = body;

    // Validasyon
    if (!appointmentId || !customerId || !employeeId || !serviceId || !amount || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ödeme oluştur
    const payment = await prisma.appointmentPayment.create({
      data: {
        appointmentId,
        customerId,
        employeeId,
        serviceId,
        amount: parseFloat(amount),
        currency,
        status,
        paymentMethod,
        transactionId,
        receiptNumber,
        notes,
        paidAt: status === 'PAID' ? new Date() : null,
        // Kredi kartı özel alanları
        cardNumber: cardNumber || null,
        cardHolderName: cardHolderName || null,
        expiryMonth: expiryMonth || null,
        expiryYear: expiryYear || null,
        cvv: cvv || null,
        installmentCount: installmentCount || 1,
        installmentAmount: installmentAmount || parseFloat(amount),
        totalAmount: totalAmount || parseFloat(amount),
        interestRate: interestRate || 0,
        bankName: bankName || null,
        cardType: cardType || null
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        employee: {
          select: {
            name: true
          }
        },
        service: {
          select: {
            name: true,
            price: true
          }
        },
        appointment: {
          select: {
            start: true,
            end: true
          }
        }
      }
    });

    // Audit log
    await AuditTrail.log({
      action: 'CREATE',
      entityType: 'AppointmentPayment',
      entityId: payment.id,
      userId: session.user.id,
      oldValues: null,
      newValues: payment,
      metadata: {
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        status: payment.status
      }
    });

    return NextResponse.json(payment);

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 