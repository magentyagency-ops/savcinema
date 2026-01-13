import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

        // params is a promise in recent Next.js versions
        const { id } = await params

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        // Transform tags array to string for SQLite
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


    // Soft delete
    await prisma.review.update({
        where: { id },
        data: { deletedAt: new Date() }
    })

    // Force cache purge
    // But this route is an API route, not a server action. 
    // Usually client should re-fetch.
    // But to be sure, we can revalidate.
    // import { revalidatePath } from 'next/cache'
    // revalidatePath('/admin/dashboard') // Might not work in API route context in all Next versions or setup.
    // Simpler: Just rely on client-side no-store or tag invalidation.
    // I'll stick to simple response for now, but client must use no-cache.

    return NextResponse.json({ success: true })
}
