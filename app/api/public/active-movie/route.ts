import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    // Public access
    const activeEntry = await prisma.activeMovie.findFirst({
        include: { movie: true },
    })

    return NextResponse.json({ activeMovie: activeEntry?.movie || null })
}
