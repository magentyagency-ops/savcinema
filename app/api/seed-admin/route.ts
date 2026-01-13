
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const email = 'admin@savcinema.com';
        const password = 'password123';
        const hashedPassword = await hash(password, 10);

        await prisma.adminUser.upsert({
            where: { email },
            update: {
                password: hashedPassword,
            },
            create: {
                email,
                password: hashedPassword,
            },
        });

        return NextResponse.json({ message: 'Admin user seeded successfully' });
    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: 'Failed to seed admin user', details: String(error) }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
