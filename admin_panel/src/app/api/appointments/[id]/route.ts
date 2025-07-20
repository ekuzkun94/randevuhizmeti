import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            provider: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employeeId, customerId, serviceId, start, end, status, note } = body

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check if employee exists
    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { provider: true }
      })

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 400 })
      }
    }

    // Check if customer exists
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      })

      if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 400 })
      }
    }

    // Check if service exists
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      })

      if (!service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 400 })
      }
    }

    // Check if provider offers this service (if both are being updated)
    if (employeeId && serviceId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { provider: true }
      })
      
      if (employee) {
        const providerService = await prisma.providerService.findFirst({
          where: {
            providerId: employee.provider.id,
            serviceId,
            isActive: true
          }
        })

        if (!providerService) {
          return NextResponse.json({ 
            error: 'Provider does not offer this service' 
          }, { status: 400 })
        }
      }
    }

    // Check for time conflicts (excluding current appointment)
    if (start && end) {
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          employeeId: employeeId || existingAppointment.employeeId,
          OR: [
            {
              AND: [
                { start: { lte: new Date(start) } },
                { end: { gt: new Date(start) } }
              ]
            },
            {
              AND: [
                { start: { lt: new Date(end) } },
                { end: { gte: new Date(end) } }
              ]
            },
            {
              AND: [
                { start: { gte: new Date(start) } },
                { end: { lte: new Date(end) } }
              ]
            }
          ]
        }
      })

      if (conflictingAppointment) {
        return NextResponse.json({ 
          error: 'Time slot conflicts with existing appointment' 
        }, { status: 400 })
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(employeeId && { employeeId }),
        ...(customerId && { customerId }),
        ...(serviceId && { serviceId }),
        ...(start && { start: new Date(start) }),
        ...(end && { end: new Date(end) }),
        ...(status && { status }),
        ...(note !== undefined && { note })
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            provider: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await context.params
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if appointment exists
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    await prisma.appointment.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { status, start, end } = body

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
    }
    
    if (start) {
      updateData.start = new Date(start);
    }
    
    if (end) {
      updateData.end = new Date(end);
    }

    // If updating time, check for conflicts
    if (start || end) {
      const newStart = start ? new Date(start) : existingAppointment.start;
      const newEnd = end ? new Date(end) : existingAppointment.end;
      
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          employeeId: existingAppointment.employeeId,
          id: { not: id }, // Exclude current appointment
          OR: [
            {
              AND: [
                { start: { lte: newStart } },
                { end: { gt: newStart } }
              ]
            },
            {
              AND: [
                { start: { lt: newEnd } },
                { end: { gte: newEnd } }
              ]
            },
            {
              AND: [
                { start: { gte: newStart } },
                { end: { lte: newEnd } }
              ]
            }
          ]
        }
      });

      if (conflictingAppointment) {
        return NextResponse.json({ 
          error: 'Bu saatte başka bir randevu bulunmaktadır' 
        }, { status: 409 });
      }
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
            provider: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true
          }
        }
      }
    })

    return NextResponse.json(updatedAppointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 