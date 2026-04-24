import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const id = searchParams.get('id') || 'audio'

    if (!url) {
        return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }

    try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch audio')

        const blob = await response.blob()

        // By claiming it is audio/mpeg and attaching it as .mp3,
        // it forces the browser to download it.
        return new NextResponse(blob, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="review-${id}.mp3"`,
            },
        })
    } catch (error) {
        console.error('Download Error:', error)
        return NextResponse.json({ error: 'Download failed' }, { status: 500 })
    }
}
