import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import rateLimit from '@/lib/rate-limit'
import { headers } from 'next/headers'

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
        const movieId = formData.get('movieId') as string
        const audioFile = formData.get('audioFile') as File
        const durationSec = parseInt(formData.get('durationSec') as string || '0')
        const displayName = formData.get('displayName') as string

        if (!movieId || !audioFile) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        // Save File Locally
        const buffer = Buffer.from(await audioFile.arrayBuffer())
        const filename = `${randomUUID()}.webm`
        const filePath = path.join(process.cwd(), 'public/uploads', filename)
        await writeFile(filePath, buffer)

        // Save to DB
        const review = await prisma.review.create({
            data: {
                movieId,
                audioUrl: `/uploads/${filename}`,
                audioMime: audioFile.type || 'audio/webm',
                durationSec,
                displayName: displayName || 'Anonymous',
                status: 'NEW',
            },
        })

        return NextResponse.json({ review })
    } catch (error) {
        console.error('Submit Simple Review Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
