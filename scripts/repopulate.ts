import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // 1. Create Movie
    const movie = await prisma.movie.upsert({
        where: { tmdbId: 83533 },
        update: {},
        create: {
            tmdbId: 83533,
            title: "Avatar: Fire and Ash",
            slug: "avatar-3",
            posterUrl: "https://image.tmdb.org/t/p/original/cfGTBeMJU5C4Q2yEq8Nh6rPspn6.jpg",
            overview: "Avatar 3 testing...",
            releaseDate: "2025-12-19"
        }
    })

    // 2. Set Active
    await prisma.activeMovie.upsert({
        where: { movieId: movie.id },
        update: {},
        create: {
            movieId: movie.id
        }
    })

    console.log('Restored movie:', movie.id)
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
