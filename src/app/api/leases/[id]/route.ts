import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for lease updates
const updateLeaseSchema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  propertyAddress: z.string().min(5, 'Property address must be at least 5 characters'),
  monthlyRent: z.number().min(0, 'Monthly rent must be positive'),
  securityDeposit: z.number().min(0, 'Security deposit must be positive').optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  status: z.enum(['ACTIVE', 'TERMINATED', 'EXPIRED']),
  terms: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/leases/[id] - Get single lease
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
    if (!hasPermission(userRole, 'leases.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const lease = await prisma.lease.findUnique({
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
        }
      }
    })

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    return NextResponse.json(lease)
  } catch (error) {
    console.error('Error fetching lease:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/leases/[id] - Update lease
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
    if (!hasPermission(userRole, 'leases.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateLeaseSchema.parse(body)

    // Check if lease exists
    const existingLease = await prisma.lease.findUnique({
      where: { id: params.id }
    })

    if (!existingLease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: validatedData.tenantId }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Validate date logic
    if (validatedData.endDate) {
      const startDate = new Date(validatedData.startDate)
      const endDate = new Date(validatedData.endDate)

      if (endDate <= startDate) {
        return NextResponse.json({
          error: 'End date must be after start date'
        }, { status: 400 })
      }
    }

    const updatedLease = await prisma.lease.update({
      where: { id: params.id },
      data: {
        tenantId: validatedData.tenantId,
        propertyAddress: validatedData.propertyAddress,
        monthlyRent: validatedData.monthlyRent,
        securityDeposit: validatedData.securityDeposit || null,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        status: validatedData.status,
        terms: validatedData.terms || null,
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
        }
      }
    })

    return NextResponse.json(updatedLease)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating lease:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/leases/[id] - Delete lease
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
    if (!hasPermission(userRole, 'leases.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if lease exists
    const existingLease = await prisma.lease.findUnique({
      where: { id: params.id }
    })

    if (!existingLease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    await prisma.lease.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Lease deleted successfully' })
  } catch (error) {
    console.error('Error deleting lease:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}