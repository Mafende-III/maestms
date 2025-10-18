import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for lease creation
const createLeaseSchema = z.object({
  tenantId: z.string().min(1, 'Tenant is required'),
  propertyAddress: z.string().min(5, 'Property address must be at least 5 characters'),
  monthlyRent: z.number().min(0, 'Monthly rent must be positive'),
  securityDeposit: z.number().min(0, 'Security deposit must be positive').optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  status: z.enum(['ACTIVE', 'TERMINATED', 'EXPIRED']).default('ACTIVE'),
  terms: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/leases - Get all leases
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'leases.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const leases = await prisma.lease.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(leases)
  } catch (error) {
    console.error('Error fetching leases:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leases - Create new lease
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'leases.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = createLeaseSchema.parse(body)

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

    const lease = await prisma.lease.create({
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

    return NextResponse.json(lease, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating lease:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}