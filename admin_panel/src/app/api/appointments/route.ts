import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const providerId = searchParams.get('providerId') || ''
    const customerId = searchParams.get('customerId') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    const where = {
      AND: [
        ...(search && [{
          OR: [
            { employee: { provider: { name: { contains: search } } } },
            { employee: { name: { contains: search } } },
            { customer: { name: { contains: search } } },
            { note: { contains: search } },
          ]
        }]),
        ...(providerId && [{ employee: { providerId } }]),
        ...(customerId && [{ customerId }]),
        ...(status && [{ status }])
      ]
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
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
          },
          attachments: {
            select: {
              id: true,
              name: true,
              type: true,
              size: true,
              path: true
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        skip,
        take: limit,
        orderBy: { start: 'desc' }
      }),
      prisma.appointment.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      appointments,
      total,
      totalPages,
      currentPage: page
    })
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { employeeId, customerId, serviceId, start, end, status, note } = body

    // Validation
    if (!employeeId || !customerId || !serviceId || !start || !end) {
      return NextResponse.json({ 
        error: 'Employee, customer, service, start and end dates are required' 
      }, { status: 400 })
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { provider: true }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 400 })
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 })
    }

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 400 })
    }

    // Check if provider offers this service (optional for now)
    // const providerService = await prisma.providerService.findFirst({
    //   where: {
    //     providerId: employee.provider.id,
    //     serviceId,
    //     isActive: true
    //   }
    // })

    // if (!providerService) {
    //   return NextResponse.json({ 
    //     error: 'Provider does not offer this service' 
    //   }, { status: 400 })
    // }

    // Check for time conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        employeeId,
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
      },
      include: {
        customer: {
          select: {
            name: true
          }
        },
        service: {
          select: {
            name: true
          }
        }
      }
    })

    if (conflictingAppointment) {
      const conflictStart = new Date(conflictingAppointment.start).toLocaleString('tr-TR')
      const conflictEnd = new Date(conflictingAppointment.end).toLocaleString('tr-TR')
      
      // Find alternative time slots
      const requestedStart = new Date(start)
      const requestedEnd = new Date(end)
      const duration = requestedEnd.getTime() - requestedStart.getTime()
      
      // Check for available slots before the conflict
      const beforeConflict = new Date(conflictingAppointment.start)
      beforeConflict.setMinutes(beforeConflict.getMinutes() - Math.ceil(duration / (1000 * 60)))
      
      // Check for available slots after the conflict
      const afterConflict = new Date(conflictingAppointment.end)
      afterConflict.setMinutes(afterConflict.getMinutes() + 15) // 15 min buffer
      
      const alternativeSlots = []
      
      // Check if slot before conflict is available
      const beforeConflictCheck = await prisma.appointment.findFirst({
        where: {
          employeeId,
          OR: [
            {
              AND: [
                { start: { lte: beforeConflict } },
                { end: { gt: beforeConflict } }
              ]
            },
            {
              AND: [
                { start: { lt: new Date(conflictingAppointment.start) } },
                { end: { gte: new Date(conflictingAppointment.start) } }
              ]
            }
          ]
        }
      })
      
      if (!beforeConflictCheck && beforeConflict > new Date()) {
        alternativeSlots.push({
          start: beforeConflict.toLocaleString('tr-TR'),
          end: new Date(beforeConflict.getTime() + duration).toLocaleString('tr-TR'),
          type: 'before'
        })
      }
      
      // Check if slot after conflict is available (with some buffer)
      const afterConflictEnd = new Date(afterConflict.getTime() + duration)
      const afterConflictCheck = await prisma.appointment.findFirst({
        where: {
          employeeId,
          OR: [
            {
              AND: [
                { start: { lte: afterConflict } },
                { end: { gt: afterConflict } }
              ]
            },
            {
              AND: [
                { start: { lt: afterConflictEnd } },
                { end: { gte: afterConflictEnd } }
              ]
            }
          ]
        }
      })
      
      if (!afterConflictCheck) {
        alternativeSlots.push({
          start: afterConflict.toLocaleString('tr-TR'),
          end: afterConflictEnd.toLocaleString('tr-TR'),
          type: 'after'
        })
      }
      
      return NextResponse.json({ 
        error: 'Time slot conflicts with existing appointment',
        details: {
          conflictingAppointment: {
            start: conflictStart,
            end: conflictEnd,
            customer: conflictingAppointment.customer.name,
            service: conflictingAppointment.service.name
          },
          requestedSlot: {
            start: new Date(start).toLocaleString('tr-TR'),
            end: new Date(end).toLocaleString('tr-TR')
          },
          alternativeSlots
        }
      }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        employeeId,
        customerId,
        serviceId,
        start: new Date(start),
        end: new Date(end),
        status: status || 'SCHEDULED',
        note
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

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 