import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMedia } from '@/lib/tmdb'
import { z } from 'zod'

const setActiveSchema = z.object({
    tmdbId: z.number(),
    mediaType: z.enum(['movie', 'tv']).optional().default('movie'),
})

export async function GET() {
    const activeEntry = await prisma.activeMovie.findFirst({
        include: { movie: true },
    })

    return NextResponse.json({ activeMovie: activeEntry?.movie || null })
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = setActiveSchema.safeParse(body)

    if (!result.success) {
        return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 })
    }

    const { tmdbId, mediaType } = result.data

    // 1. Fetch from TMDB
    const details = await getMedia(tmdbId, mediaType)
    if (!details) {
        return NextResponse.json({ error: 'Media not found on TMDB' }, { status: 404 })
    }

    // 2. Upsert Movie/Media
    const movie = await prisma.movie.upsert({
        where: { tmdbId: details.id },
        update: {
            title: details.title || details.name || 'Unknown',
            overview: details.overview,
            posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/original${details.poster_path}` : null,
            releaseDate: details.release_date || details.first_air_date,
            mediaType: details.media_type,
            slug: details.id.toString(),
        },
        create: {
            tmdbId: details.id,
            title: details.title || details.name || 'Unknown',
            overview: details.overview,
            posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/original${details.poster_path}` : null,
            releaseDate: details.release_date || details.first_air_date,
            mediaType: details.media_type,
            slug: details.id.toString(),
        },
    })

    // 3. Set Active
    await prisma.activeMovie.deleteMany()
    const active = await prisma.activeMovie.create({
        data: {
            movieId: movie.id,
        },
        include: { movie: true }
    })

    return NextResponse.json({ activeMovie: active.movie })
}
