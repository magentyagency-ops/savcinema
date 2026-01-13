import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const uploadSchema = z.object({
    movieId: z.string(),
    contentType: z.enum(['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4']),
    fileSize: z.number().max(10 * 1024 * 1024), // 10MB
})

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const result = uploadSchema.safeParse(json)

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 })
        }

        const { movieId, contentType } = result.data
        const ext = contentType.split('/')[1]
        const filename = `${randomUUID()}.${ext}`
        // key is used for the DB mainly.
        const key = `uploads/${filename}`

        // We return a URL that the client uses to PUT the data.
        // Since we are local, we can create an API route /api/public/upload-handler/[filename]
        const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/public/local-upload?filename=${filename}`

        return NextResponse.json({ uploadUrl, key })
    } catch (error) {
        console.error('Upload URL Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
