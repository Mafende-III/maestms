import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for expense updates
const updateExpenseSchema = z.object({
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

// GET /api/expenses/[id] - Get single expense
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
    if (!hasPermission(userRole, 'expenses.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/expenses/[id] - Update expense
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
    if (!hasPermission(userRole, 'expenses.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateExpenseSchema.parse(body)

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
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
      }
    })

    return NextResponse.json(updatedExpense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/expenses/[id] - Delete expense
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
    if (!hasPermission(userRole, 'expenses.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id }
    })

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Expense deleted successfully' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}