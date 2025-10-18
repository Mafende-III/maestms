import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for expense creation
const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  category: z.enum(['SHOP_EXPENSES', 'HOUSEHOLD_EXPENSES', 'PROPERTY_MAINTENANCE', 'UTILITIES', 'TAXES', 'INSURANCE', 'LEGAL', 'MARKETING', 'REPAIRS', 'SECURITY', 'CLEANING', 'SUPPLIES', 'TRANSPORT', 'STAFF_WAGES', 'OTHER']),
  expenseDate: z.string().datetime('Invalid expense date'),
  paymentMethod: z.enum(['CASH', 'MPESA', 'BANK_TRANSFER', 'CHEQUE', 'NOT_SPECIFIED']).optional(),
  receiptNumber: z.string().optional(),
  vendor: z.string().optional(),
  propertyAddress: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/expenses - Get all expenses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'expenses.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const propertyAddress = searchParams.get('propertyAddress')

    const whereClause: any = {}
    if (category && category !== 'ALL') whereClause.category = category
    if (propertyAddress && propertyAddress !== 'ALL') whereClause.propertyAddress = propertyAddress

    const expenses = await prisma.expense.findMany({
      where: whereClause,
      orderBy: {
        expenseDate: 'desc'
      }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'expenses.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = createExpenseSchema.parse(body)

    const expense = await prisma.expense.create({
      data: {
        description: validatedData.description,
        amount: validatedData.amount,
        category: validatedData.category,
        expenseDate: new Date(validatedData.expenseDate),
        paymentMethod: validatedData.paymentMethod || null,
        receiptNumber: validatedData.receiptNumber || null,
        vendor: validatedData.vendor || null,
        propertyAddress: validatedData.propertyAddress || null,
        notes: validatedData.notes || null,
        recordedBy: session.user.id,
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}