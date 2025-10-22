import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'
import { z } from 'zod'

// Validation schema for daily business report creation
const createDailyReportSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  reportDate: z.string().datetime('Invalid report date'),
  shopSales: z.number().min(0).optional().default(0),
  salonSales: z.number().min(0).optional().default(0),
  cinemaSales: z.number().min(0).optional().default(0),
  mobileMoneyRev: z.number().min(0).optional().default(0),
  shopExpenses: z.number().min(0).optional().default(0),
  homeExpenses: z.number().min(0).optional().default(0),
  purchases: z.number().min(0).optional().default(0),
  currency: z.string().default('UGX'),
  notes: z.string().optional(),
})

// GET /api/daily-reports - Get daily business reports
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
    const assetId = searchParams.get('assetId')
    const date = searchParams.get('date')

    const whereClause: any = {}
    if (assetId) whereClause.assetId = assetId
    if (date) {
      const reportDate = new Date(date)
      const nextDay = new Date(reportDate)
      nextDay.setDate(nextDay.getDate() + 1)
      whereClause.reportDate = {
        gte: reportDate,
        lt: nextDay
      }
    }

    const reports = await prisma.dailyBusinessReport.findMany({
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
        reportDate: 'desc'
      }
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching daily reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/daily-reports - Create new daily business report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role as UserRole
    if (!hasPermission(userRole, 'sales.create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validatedData = createDailyReportSchema.parse(body)

    // Check if report already exists for this date and asset
    const existingReport = await prisma.dailyBusinessReport.findFirst({
      where: {
        assetId: validatedData.assetId,
        reportDate: {
          gte: new Date(validatedData.reportDate),
          lt: new Date(new Date(validatedData.reportDate).getTime() + 24 * 60 * 60 * 1000)
        }
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Daily report already exists for this date and asset' },
        { status: 409 }
      )
    }

    const report = await prisma.dailyBusinessReport.create({
      data: {
        assetId: validatedData.assetId,
        reportDate: new Date(validatedData.reportDate),
        shopSales: validatedData.shopSales,
        salonSales: validatedData.salonSales,
        cinemaSales: validatedData.cinemaSales,
        mobileMoneyRev: validatedData.mobileMoneyRev,
        shopExpenses: validatedData.shopExpenses,
        homeExpenses: validatedData.homeExpenses,
        purchases: validatedData.purchases,
        currency: validatedData.currency,
        notes: validatedData.notes || null,
        reportedBy: session.user.id,
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            location: true
          }
        }
      }
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating daily report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}