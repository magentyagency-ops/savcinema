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
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      {movie?.posterUrl && (
        <div
          className="absolute inset-0 z-0 opacity-20 blur-3xl scale-110"
          style={{
            backgroundImage: `url(${movie.posterUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-0" />

      <div className="z-10 w-full max-w-4xl px-6 py-12 flex flex-col md:flex-row gap-12 items-center">
        {movie ? (
          <>
            {/* Poster */}
            <div className="relative shrink-0 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <img
                src={movie.posterUrl || ''}
                alt={movie.title}
                className="relative w-64 md:w-80 rounded-xl shadow-2xl border border-white/10 rotate-1 group-hover:rotate-0 transition-transform duration-500"
              />
            </div>

            {/* Content */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-6">
              <div>
                <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-wider rounded-full mb-4 border border-indigo-500/20">
                  {movie.mediaType === 'tv' ? 'SÉRIE DU MOMENT' : 'FILM DU MOMENT'}
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight tight-shadow mb-4">
                  {movie.title}
                </h1>
                <p className="text-lg text-neutral-300 leading-relaxed max-w-lg mb-2">
                  {movie.overview}
                </p>
                <p className="text-sm text-neutral-500">
                  Sortie : {new Date(movie.releaseDate || '').toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>

              <HomeClient movie={movie} />
            </div>

            {/* SAV CTA Card - Floating or Integrated */}
            <div className="hidden md:flex flex-col items-center animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
              <div className="relative group cursor-pointer" title="Allô SAV ?">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative bg-neutral-900 border border-neutral-800 p-2 rounded-2xl flex flex-col items-center gap-3 w-48 shadow-2xl transform group-hover:-translate-y-2 transition duration-300">
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-800">
                    <img src="/sav-hero.png" alt="Allô SAV" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" />
                  </div>
                  <div className="text-center pb-2">
                    <p className="text-yellow-400 font-bold text-sm tracking-wider">ALLÔ SAV ?</p>
                    <p className="text-neutral-400 text-[10px] leading-tight mt-1">Lâche ton meilleur avis !</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center w-full space-y-4">
            <h1 className="text-3xl font-bold text-neutral-400">Aucun film actif</h1>
            <p className="text-neutral-500">L'admin n'a pas encore sélectionné de film.</p>
          </div>
        )}
      </div>

      <footer className="absolute bottom-6 text-neutral-600 text-xs">
        SAV du Cinéma &copy; {new Date().getFullYear()}
      </footer>
    </main >
  );
}
