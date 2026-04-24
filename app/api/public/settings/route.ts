import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    const settings = await prisma.globalSettings.findUnique({
        where: { id: 'singleton' }
    })

    return NextResponse.json({ settings })
}
