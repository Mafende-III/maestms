import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for asset updates
const updateAssetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['PROPERTY', 'EQUIPMENT', 'FURNITURE', 'VEHICLE', 'OTHER']),
  purchasePrice: z.number().min(0, 'Purchase price must be positive').optional(),
  currentValue: z.number().min(0, 'Current value must be positive').optional(),
  purchaseDate: z.string().datetime('Invalid purchase date').optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
  location: z.string().optional(),
  serialNumber: z.string().optional(),
  warrantyExpiry: z.string().datetime('Invalid warranty expiry date').optional(),
  maintenanceDate: z.string().datetime('Invalid maintenance date').optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'DAMAGED', 'DISPOSED']),
  notes: z.string().optional(),
})

// GET /api/assets/[id] - Get single asset
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
    if (!hasPermission(userRole, 'assets.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const asset = await prisma.asset.findUnique({
      where: { id: params.id }
    })

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/assets/[id] - Update asset
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
    if (!hasPermission(userRole, 'assets.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateAssetSchema.parse(body)

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id: params.id }
    })

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const updatedAsset = await prisma.asset.update({
      where: { id: params.id },
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
      }
    })

    return NextResponse.json(updatedAsset)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/assets/[id] - Delete asset
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
    if (!hasPermission(userRole, 'assets.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if asset exists
    const existingAsset = await prisma.asset.findUnique({
      where: { id: params.id }
    })

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    await prisma.asset.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Asset deleted successfully' })
  } catch (error) {
    console.error('Error deleting asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}