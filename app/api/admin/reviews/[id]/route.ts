import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { del } from '@vercel/blob'

const updateSchema = z.object({
    status: z.enum(['NEW', 'APPROVED', 'ARCHIVED', 'REJECTED']).optional(),
    tags: z.array(z.string()).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const json = await request.json()
        const result = updateSchema.safeParse(json)

        const { id } = await params

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        const updateData: any = { ...result.data }
        if (result.data.tags) {
            updateData.tags = result.data.tags.join(',')
        }

        const review = await prisma.review.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json({ review })
    } catch (error) {
        return NextResponse.json({ error: 'Error updating' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    try {
        // 1. Get the review to find the audio URL
        const review = await prisma.review.findUnique({
            where: { id },
            select: { audioUrl: true }
        })

        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 })
        }

        // 2. Delete from Vercel Blob
        if (review.audioUrl && review.audioUrl.startsWith('http')) {
            try {
                await del(review.audioUrl);
            } catch (err) {
                console.error("Failed to delete blob:", err);
                // Continue to delete DB record anyway
            }
        }

        // 3. Hard Delete from DB
        await prisma.review.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Delete error:", error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }
}
