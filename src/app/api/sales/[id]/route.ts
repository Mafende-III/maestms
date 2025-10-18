import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for sale updates
const updateSaleSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  salePrice: z.number().min(0, 'Sale price must be positive'),
  saleDate: z.string().datetime('Invalid sale date'),
  buyerName: z.string().optional(),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  category: z.enum(['CINEMA', 'MOBILE_MONEY', 'CHARCOAL', 'PROPERTY', 'LIVESTOCK', 'PRODUCE', 'RETAIL', 'SERVICES', 'OTHER']),
  saleType: z.enum(['SHOP_SALE', 'PROPERTY_SALE', 'BULK_SALE', 'SERVICE']),
  paymentMethod: z.enum(['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'NOT_SPECIFIED']).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED']),
  quantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  location: z.string().optional(),
  agentName: z.string().optional(),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100').optional(),
  commissionAmount: z.number().min(0, 'Commission amount must be positive').optional(),
  notes: z.string().optional(),
})

// GET /api/sales/[id] - Get single sale
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
    if (!hasPermission(userRole, 'sales.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id }
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/sales/[id] - Update sale
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
    if (!hasPermission(userRole, 'sales.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateSaleSchema.parse(body)

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id: params.id }
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Calculate commission amount if rate is provided
    let commissionAmount = validatedData.commissionAmount
    if (validatedData.commissionRate && !commissionAmount) {
      commissionAmount = (validatedData.salePrice * validatedData.commissionRate) / 100
    }

    const updatedSale = await prisma.sale.update({
      where: { id: params.id },
      data: {
        propertyAddress: validatedData.propertyAddress,
        salePrice: validatedData.salePrice,
        saleDate: new Date(validatedData.saleDate),
        buyerName: validatedData.buyerName,
        buyerPhone: validatedData.buyerPhone || null,
        buyerEmail: validatedData.buyerEmail || null,
        agentName: validatedData.agentName || null,
        commissionRate: validatedData.commissionRate || null,
        commissionAmount: commissionAmount || null,
        saleType: validatedData.saleType,
        paymentMethod: validatedData.paymentMethod,
        paymentStatus: validatedData.paymentStatus,
        documentStatus: validatedData.documentStatus,
        transferDate: validatedData.transferDate ? new Date(validatedData.transferDate) : null,
        notes: validatedData.notes || null,
      }
    })

    return NextResponse.json(updatedSale)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/sales/[id] - Delete sale
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
    if (!hasPermission(userRole, 'sales.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id: params.id }
    })

    if (!existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    await prisma.sale.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Sale deleted successfully' })
  } catch (error) {
    console.error('Error deleting sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}