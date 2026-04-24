import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { randomUUID } from 'crypto'
import rateLimit from '@/lib/rate-limit'
import { headers } from 'next/headers'
import { getMedia } from '@/lib/tmdb'

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500,
})

export async function POST(request: Request) {
    try {
        const ip = (await headers()).get('x-forwarded-for') || 'anonymous'

        try {
            await limiter.check(5, ip) // 5 requests per minute per IP
        } catch {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
        }

        const formData = await request.formData()
        let movieId = formData.get('movieId') as string
        const audioFile = formData.get('audioFile') as File
        const durationSec = parseInt(formData.get('durationSec') as string || '0')
        const displayName = formData.get('displayName') as string

        if (!movieId || !audioFile) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        // Handle TMDB-prefixed IDs (local overrides)
        if (movieId.startsWith('tmdb-')) {
            const tmdbIdStr = movieId.replace('tmdb-', '')
            const tmdbId = parseInt(tmdbIdStr)
            
            // Check if already in DB
            let movie = await prisma.movie.findUnique({
                where: { tmdbId }
            })

            if (!movie) {
                // Not in DB, fetch from TMDB and create
                // We don't know if it's a movie or tv, but we can try to guess or use the media_type if we have it.
                // For now, let's assume 'movie' or try both. 
                // Actually, I should have passed the media_type in the formData.
                // Let's try to get it as movie first, then tv if it fails.
                let tmdbData = await getMedia(tmdbId, 'movie')
                if (!tmdbData) tmdbData = await getMedia(tmdbId, 'tv')

                if (tmdbData) {
                    movie = await prisma.movie.create({
                        data: {
                            tmdbId: tmdbData.id,
                            title: tmdbData.title || tmdbData.name || 'Unknown',
                            slug: `${tmdbData.id}-${randomUUID().slice(0, 4)}`,
                            posterUrl: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : null,
                            overview: tmdbData.overview,
                            releaseDate: tmdbData.release_date || tmdbData.first_air_date,
                            mediaType: tmdbData.media_type as string
                        }
                    })
                }
            }

            if (movie) {
                movieId = movie.id
            } else {
                return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
            }
        }

        // Save File to Vercel Blob
        const ext = audioFile.name.split('.').pop() || 'webm'
        const filename = `reviews/${randomUUID()}.${ext}`
        const blob = await put(filename, audioFile, {
            access: 'public',
        })

        // Save to DB
        const review = await prisma.review.create({
            data: {
                movieId,
                audioUrl: blob.url,
                audioMime: audioFile.type || 'audio/webm',
                durationSec,
                displayName: displayName || 'Anonymous',
                status: 'NEW',
            },
        })

        return NextResponse.json({ review })
    } catch (error) {
        console.error('Submit Simple Review Error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 })
    }
}
