import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditTrail } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payment = await prisma.appointmentPayment.findUnique({
      where: { id: params.id },
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

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json(payment);

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      currency,
      status,
      paymentMethod,
      transactionId,
      receiptNumber,
      notes
    } = body;

    // Mevcut ödemeyi getir
    const existingPayment = await prisma.appointmentPayment.findUnique({
      where: { id: params.id }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Ödeme güncelle
    const updatedPayment = await prisma.appointmentPayment.update({
      where: { id: params.id },
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
        paidAt: status === 'PAID' && existingPayment.status !== 'PAID' ? new Date() : existingPayment.paidAt
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
      action: 'UPDATE',
      entityType: 'AppointmentPayment',
      entityId: updatedPayment.id,
      userId: session.user.id,
      oldValues: existingPayment,
      newValues: updatedPayment,
      metadata: {
        amount: updatedPayment.amount,
        paymentMethod: updatedPayment.paymentMethod,
        status: updatedPayment.status
      }
    });

    return NextResponse.json(updatedPayment);

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Mevcut ödemeyi getir
    const existingPayment = await prisma.appointmentPayment.findUnique({
      where: { id: params.id }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Sadece durum güncelle
    const updatedPayment = await prisma.appointmentPayment.update({
      where: { id: params.id },
      data: {
        status,
        paidAt: status === 'PAID' && existingPayment.status !== 'PAID' ? new Date() : existingPayment.paidAt
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
      action: 'UPDATE',
      entityType: 'AppointmentPayment',
      entityId: updatedPayment.id,
      userId: session.user.id,
      oldValues: { status: existingPayment.status },
      newValues: { status: updatedPayment.status },
      metadata: {
        statusChange: `${existingPayment.status} → ${updatedPayment.status}`
      }
    });

    return NextResponse.json(updatedPayment);

  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mevcut ödemeyi getir
    const existingPayment = await prisma.appointmentPayment.findUnique({
      where: { id: params.id }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Ödeme sil
    await prisma.appointmentPayment.delete({
      where: { id: params.id }
    });

    // Audit log
    await AuditTrail.log({
      action: 'DELETE',
      entityType: 'AppointmentPayment',
      entityId: params.id,
      userId: session.user.id,
      oldValues: existingPayment,
      newValues: null,
      metadata: {
        amount: existingPayment.amount,
        paymentMethod: existingPayment.paymentMethod,
        status: existingPayment.status
      }
    });

    return NextResponse.json({ message: 'Payment deleted successfully' });

  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 