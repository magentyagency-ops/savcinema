import { NextResponse } from 'next/server'
import { searchMedia } from '@/lib/tmdb'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q) return NextResponse.json({ results: [] })

    const results = await searchMedia(q)
    return NextResponse.json({ results })
}
