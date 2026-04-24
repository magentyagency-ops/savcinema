import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET() {
    try {
        const email = 'admin@savcinema.com';
        const password = 'ashanti123';
        const hashedPassword = await hash(password, 10);

        const user = await prisma.adminUser.upsert({
            where: { email },
            update: {
                password: hashedPassword,
            },
            create: {
                email,
                password: hashedPassword,
            },
        });

        console.log('Admin user seeded:', user.email);
        return NextResponse.json({ 
            message: 'Admin user seeded successfully',
            email: user.email,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Seeding error:', error);
        return NextResponse.json({ error: 'Failed to seed admin user', details: String(error) }, { status: 500 });
    }
}
