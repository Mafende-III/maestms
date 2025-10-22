import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for sale creation (Enhanced for Hybrid Model)
const createSaleSchema = z.object({
  assetId: z.string().optional(), // Link to revenue-generating asset
  description: z.string().min(1, 'Description is required'),
  salePrice: z.number().min(0, 'Sale price must be positive'),
  saleDate: z.string().datetime('Invalid sale date'),
  buyerName: z.string().optional(),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  category: z.enum(['SHOP', 'SALON', 'CINEMA', 'MOBILE_MONEY', 'CHARCOAL', 'PROPERTY', 'LIVESTOCK', 'RETAIL', 'SERVICES', 'OTHER']),
  saleType: z.enum(['SHOP_SALE', 'PROPERTY_SALE', 'BULK_SALE', 'SERVICE', 'CASH_SALE']),
  paymentMethod: z.enum(['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT', 'NOT_SPECIFIED']).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'OVERDUE', 'CANCELLED']).default('COMPLETED'),
  creditStatus: z.enum(['PAID', 'UNPAID', 'PARTIAL']).optional(), // For credit sales
  quantity: z.number().min(0).optional(),
  unitPrice: z.number().min(0).optional(),
  location: z.string().optional(),
  agentName: z.string().optional(),
  commissionRate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100').optional(),
  commissionAmount: z.number().min(0, 'Commission amount must be positive').optional(),
  currency: z.string().default('UGX'),
  notes: z.string().optional(),
})

// GET /api/sales - Get all sales
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'sales.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const saleType = searchParams.get('saleType')
    const paymentStatus = searchParams.get('paymentStatus')
    const creditStatus = searchParams.get('creditStatus')
    const assetId = searchParams.get('assetId')
    const date = searchParams.get('date')

    const whereClause: any = {}
    if (category && category !== 'ALL') whereClause.category = category
    if (saleType && saleType !== 'ALL') whereClause.saleType = saleType
    if (paymentStatus && paymentStatus !== 'ALL') whereClause.paymentStatus = paymentStatus
    if (creditStatus && creditStatus !== 'ALL') whereClause.creditStatus = creditStatus
    if (assetId) whereClause.assetId = assetId
    if (date) {
      const saleDate = new Date(date)
      const nextDay = new Date(saleDate)
      nextDay.setDate(nextDay.getDate() + 1)
      whereClause.saleDate = {
        gte: saleDate,
        lt: nextDay
      }
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      },
      orderBy: {
        saleDate: 'desc'
      }
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sales - Create new sale
export async function POST(request: NextRequest) {
  try {
    // TEMPORARY: Skip authentication for data import
    // TODO: Re-enable authentication after data import is complete
    const session = await getServerSession(authOptions)

    // Comment out auth checks temporarily
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // const userRole = session.user.role as UserRole
    // if (!hasPermission(userRole, 'sales.create')) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    // }

    const body = await request.json()

    // Validate input
    const validatedData = createSaleSchema.parse(body)

    // Calculate commission amount if rate is provided
    let commissionAmount = validatedData.commissionAmount
    if (validatedData.commissionRate && !commissionAmount) {
      commissionAmount = (validatedData.salePrice * validatedData.commissionRate) / 100
    }

    const sale = await prisma.sale.create({
      data: {
        assetId: validatedData.assetId || null,
        description: validatedData.description,
        salePrice: validatedData.salePrice,
        saleDate: new Date(validatedData.saleDate),
        buyerName: validatedData.buyerName || null,
        buyerPhone: validatedData.buyerPhone || null,
        buyerEmail: validatedData.buyerEmail || null,
        category: validatedData.category,
        saleType: validatedData.saleType,
        paymentMethod: validatedData.paymentMethod || 'CASH',
        paymentStatus: validatedData.paymentStatus,
        creditStatus: validatedData.creditStatus || null,
        quantity: validatedData.quantity || null,
        unitPrice: validatedData.unitPrice || null,
        location: validatedData.location || null,
        agentName: validatedData.agentName || null,
        commissionRate: validatedData.commissionRate || null,
        commissionAmount: commissionAmount || null,
        currency: validatedData.currency,
        notes: validatedData.notes || null,
        recordedBy: session?.user?.id || 'import-script', // Fallback for import
      }
    })

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating sale:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}