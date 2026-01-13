import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('movieId')
    const status = searchParams.get('status')

    const where: any = {}
    if (movieId) where.movieId = movieId
    if (status) where.status = status as any // Cast to enum

    // Soft delete filter usually
    where.deletedAt = null

    const reviews = await prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { movie: true }
    })

    return NextResponse.json({ reviews })
}

const updateSchema = z.object({
    status: z.enum(['NEW', 'APPROVED', 'ARCHIVED', 'REJECTED']).optional(),
    tags: z.array(z.string()).optional(),
})

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // We need ID from URL, but App Router usually passes params in second arg if [id].
    // But here I'm using query param or body. 
    // Let's use a dynamic route /api/admin/reviews/[id] for PATCH/DELETE?
    // Or just put ID in body for simplicity if list view.
    // Standard REST is /api/admin/reviews/[id].
    // I will assume I create a separate file for [id] or handle it here if I passed ID in body, 
    // but let's stick to REST best practice if possible.
    // I will create `app/api/admin/reviews/[id]/route.ts` separately.
    // So this file is just GET and generic ops?
    // I'll create the [id] route next.

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
