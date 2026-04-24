import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.globalSettings.upsert({
        where: { id: 'singleton' },
        update: {},
        create: { id: 'singleton' }
    })

    return NextResponse.json({ settings })
}

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { latestVideoUrl } = await request.json()

    const settings = await prisma.globalSettings.upsert({
        where: { id: 'singleton' },
        update: { latestVideoUrl },
        create: { id: 'singleton', latestVideoUrl }
    })

    return NextResponse.json({ settings })
}
