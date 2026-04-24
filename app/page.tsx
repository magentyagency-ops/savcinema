import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import HomeClient from '@/components/public/home-client';
import { prisma } from '@/lib/prisma';

// Server Component to fetch initial data
async function getActiveMovie() {
  const active = await prisma.activeMovie.findFirst({
    include: { movie: true }
  });
  return active?.movie || null;
}

export const dynamic = 'force-dynamic';

export default async function Home() {
  const movie = await getActiveMovie();

  return (
    <HomeClient initialMovie={movie} />
  );
}
