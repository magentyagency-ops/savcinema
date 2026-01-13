import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// I'll use a simple hashing function or import bcrypt. 
// I should install bcryptjs (lighter, no compilation issues on some envs) and @types/bcryptjs.
// Or just import 'crypto' for simple sha256 as fallback if dependencies are strict. 
// Plan said "NextAuth Credentials". NextAuth uses authorize(). 
// I will assume I install `bcryptjs`.

async function main() {
    const email = process.env.ADMIN_SEED_EMAIL || 'admin@savcinema.com'
    const password = process.env.ADMIN_SEED_PASSWORD || 'password123'

    const hashedPassword = await hash(password, 10)

    console.log(`Seeding admin user: ${email}`)

    await prisma.adminUser.upsert({
        where: { email },
        update: {
            password: hashedPassword,
        },
        create: {
            email,
            password: hashedPassword,
        },
    })

    console.log("Admin user seeded.")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
