import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for asset creation
const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['PROPERTY', 'EQUIPMENT', 'FURNITURE', 'VEHICLE', 'OTHER']),
  purchasePrice: z.number().min(0, 'Purchase price must be positive').optional(),
  currentValue: z.number().min(0, 'Current value must be positive').optional(),
  purchaseDate: z.string().datetime('Invalid purchase date').optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('GOOD'),
  location: z.string().optional(),
  serialNumber: z.string().optional(),
  warrantyExpiry: z.string().datetime('Invalid warranty expiry date').optional(),
  maintenanceDate: z.string().datetime('Invalid maintenance date').optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'DAMAGED', 'DISPOSED']).default('ACTIVE'),
  notes: z.string().optional(),
})

// GET /api/assets - Get all assets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'assets.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const location = searchParams.get('location')

    const whereClause: any = {}
    if (category && category !== 'ALL') whereClause.category = category
    if (status && status !== 'ALL') whereClause.status = status
    if (location && location !== 'ALL') whereClause.location = location

    const assets = await prisma.asset.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(assets)
  } catch (error) {
    console.error('Error fetching assets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/assets - Create new asset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'assets.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = createAssetSchema.parse(body)

    const asset = await prisma.asset.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        category: validatedData.category,
        purchasePrice: validatedData.purchasePrice || null,
        currentValue: validatedData.currentValue || null,
        purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
        condition: validatedData.condition,
        location: validatedData.location || null,
        serialNumber: validatedData.serialNumber || null,
        warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : null,
        maintenanceDate: validatedData.maintenanceDate ? new Date(validatedData.maintenanceDate) : null,
        status: validatedData.status,
        notes: validatedData.notes || null,
        recordedBy: session.user.id,
      }
    })

    return NextResponse.json(asset, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}