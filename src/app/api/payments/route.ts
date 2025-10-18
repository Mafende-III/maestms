import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for payment creation
const createPaymentSchema = z.object({
  leaseId: z.string().min(1, 'Lease is required'),
  tenantId: z.string().min(1, 'Tenant is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  paymentDate: z.string().datetime('Invalid payment date'),
  dueDate: z.string().datetime('Invalid due date').optional(),
  paymentMethod: z.enum(['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE']),
  status: z.enum(['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED']).default('COMPLETED'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/payments - Get all payments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'payments.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const leaseId = searchParams.get('leaseId')
    const status = searchParams.get('status')

    const whereClause: any = {}
    if (tenantId) whereClause.tenantId = tenantId
    if (leaseId) whereClause.leaseId = leaseId
    if (status) whereClause.status = status

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          }
        },
        lease: {
          select: {
            id: true,
            propertyAddress: true,
            monthlyRent: true,
            status: true,
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'payments.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = createPaymentSchema.parse(body)

    // Check if lease exists
    const lease = await prisma.lease.findUnique({
      where: { id: validatedData.leaseId }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Validate that tenant matches lease
    if (lease.tenantId !== validatedData.tenantId) {
      return NextResponse.json({
        error: 'Tenant does not match the selected lease'
      }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        leaseId: validatedData.leaseId,
        tenantId: validatedData.tenantId,
        amount: validatedData.amount,
        paymentDate: new Date(validatedData.paymentDate),
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        paymentMethod: validatedData.paymentMethod,
        status: validatedData.status,
        referenceNumber: validatedData.referenceNumber || null,
        notes: validatedData.notes || null,
        recordedBy: session.user.id,
      },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          }
        },
        lease: {
          select: {
            id: true,
            propertyAddress: true,
            monthlyRent: true,
            status: true,
          }
        }
      }
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}