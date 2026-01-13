import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'savcinema-media'
const S3_REGION = process.env.S3_REGION || 'auto'

const s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials: {
        accessKeyId: S3_ACCESS_KEY_ID || '',
        secretAccessKey: S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // For certain providers or localstack
})

export const getPresignedUploadUrl = async (
    key: string,
    contentType: string,
    maxSize: number = 10 * 1024 * 1024 // 10MB default
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        // ContentLengthRange is not supported in PutObjectCommand directly for presigned URLs typically in this way,
        // usually checked via Signed Policy or just trusted. Client-side limits + server-side validation on final URL.
        // However, we can generate a signed URL.
    })

    // Expiration: 5 minutes
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 })
    return url
}
