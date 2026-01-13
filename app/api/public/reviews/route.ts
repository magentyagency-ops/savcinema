import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Review schema
const reviewSchema = z.object({
    movieId: z.string(),
    audioUrl: z.string().url(),
    audioMime: z.string(),
    durationSec: z.number().int().positive(),
    displayName: z.string().optional(),
})

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const result = reviewSchema.safeParse(json)

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 })
        }

        const { movieId, audioUrl, audioMime, durationSec, displayName } = result.data

        // Verify movie exists
        const movie = await prisma.movie.findUnique({ where: { id: movieId } })
        if (!movie) {
            return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
        }

        const review = await prisma.review.create({
            data: {
                movieId,
                audioUrl,
                audioMime,
                durationSec,
                displayName,
                status: 'NEW', // Default status
            },
        })

        return NextResponse.json({ review })
    } catch (error) {
        console.error('Submit Review Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
