import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function PUT(request: Request) {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
        return NextResponse.json({ error: 'Missing filename' }, { status: 400 })
    }

    try {
        const buffer = Buffer.from(await request.arrayBuffer())
        const filePath = path.join(process.cwd(), 'public/uploads', filename)

        await writeFile(filePath, buffer)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Local Upload Error:', error)
        console.log('Upload error details:', error);
        return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
    }
}
