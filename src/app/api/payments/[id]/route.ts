import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for payment updates
const updatePaymentSchema = z.object({
  leaseId: z.string().min(1, 'Lease is required'),
  tenantId: z.string().min(1, 'Tenant is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  paymentDate: z.string().datetime('Invalid payment date'),
  dueDate: z.string().datetime('Invalid due date').optional(),
  paymentMethod: z.enum(['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE']),
  status: z.enum(['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/payments/[id] - Get single payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'payments.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
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

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payments/[id] - Update payment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'payments.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = updatePaymentSchema.parse(body)

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: params.id }
    })

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

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

    const updatedPayment = await prisma.payment.update({
      where: { id: params.id },
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

    return NextResponse.json(updatedPayment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payments/[id] - Delete payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'payments.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if payment exists
    const existingPayment = await prisma.payment.findUnique({
      where: { id: params.id }
    })

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    await prisma.payment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}