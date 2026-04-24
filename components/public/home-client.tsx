'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, RotateCcw, Send, CheckCircle2, Loader2, Sparkles, Search, Calendar, Film, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioVisualizer } from '@/components/ui/visualizer';
import { toast } from 'sonner';
import ky from 'ky';

export default function HomeClient({ initialMovie }: { initialMovie: any }) {
    const [currentMovie, setCurrentMovie] = useState(initialMovie);
    const [step, setStep] = useState<'IDLE' | 'REC' | 'PREVIEW' | 'SENDING' | 'DONE'>('IDLE');
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [chunks, setChunks] = useState<Blob[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [displayName, setDisplayName] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [latestVideoUrl, setLatestVideoUrl] = useState<string | null>(null);
    const [openSearch, setOpenSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetch('/api/public/settings').then(res => res.json()).then(data => {
            if (data.settings?.latestVideoUrl) {
                setLatestVideoUrl(data.settings.latestVideoUrl);
            }
        });
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/public/movies/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setSearchResults(data.results || []);
        } catch (err) {
            toast.error('Erreur de recherche');
        } finally {
            setIsSearching(false);
        }
    };

    const selectLocalMovie = (tmdbItem: any) => {
        const movieObj = {
            id: `tmdb-${tmdbItem.id}`,
            title: tmdbItem.title || tmdbItem.name,
            posterUrl: tmdbItem.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbItem.poster_path}` : null,
            mediaType: tmdbItem.media_type,
            releaseDate: tmdbItem.release_date || tmdbItem.first_air_date,
            overview: tmdbItem.overview
        };
        setCurrentMovie(movieObj);
        setOpenSearch(false);
        toast.success(`Film changé pour : ${movieObj.title}`);
    };

    const startRecording = async () => {
        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStream(audioStream);
            const recorder = new MediaRecorder(audioStream);
            setMediaRecorder(recorder);
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) setChunks((prev) => [...prev, e.data]);
            };
            recorder.start();
            setIsRecording(true);
            setStep('REC');
            let sec = 0;
            setDuration(0);
            timerRef.current = setInterval(() => {
                sec++;
                setDuration(sec);
                if (sec >= 90) stopRecording();
            }, 1000);
        } catch (err) {
            console.error(err);
            toast.error('Microphone inaccessible');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            stream?.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setStep('PREVIEW');
        }
    };

    useEffect(() => {
        if (!isRecording && chunks.length > 0 && step === 'PREVIEW') {
            const mimeType = mediaRecorder?.mimeType || 'audio/webm';
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        }
    }, [chunks, isRecording, step, mediaRecorder]);

    const reset = () => {
        setChunks([]);
        setAudioUrl(null);
        setDuration(0);
        setStep('IDLE');
    };

    const submitReview = async () => {
        if (!displayName.trim()) {
            toast.error('Un p\'tit pseudo pour la postérité ?');
            return;
        }
        try {
            setStep('SENDING');
            const mimeType = mediaRecorder?.mimeType || 'audio/webm';
            const blob = new Blob(chunks, { type: mimeType });
            const formData = new FormData();
            formData.append('movieId', currentMovie.id);
            const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
            formData.append('audioFile', blob, `review.${ext}`);
            formData.append('durationSec', duration.toString());
            formData.append('displayName', displayName);
            await ky.post('/api/public/reviews-simple', {
                body: formData,
                timeout: 60000
            });
            setStep('DONE');
        } catch (err) {
            console.error(err);
            toast.error('Erreur lors de l\'envoi');
            setStep('PREVIEW');
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (!currentMovie) return null;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black text-white">
            {/* Background Ambience */}
            {currentMovie?.posterUrl && (
                <div
                    className="absolute inset-0 z-0 opacity-20 blur-3xl scale-110"
                    style={{
                        backgroundImage: `url(${currentMovie.posterUrl})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover'
                    }}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-0" />

            <div className="z-10 w-full max-w-4xl px-6 py-12 flex flex-col md:flex-row gap-12 items-center">
                {/* Poster + SAV Card overlap container */}
                <div className="relative shrink-0 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <img
                        src={currentMovie.posterUrl || ''}
                        alt={currentMovie.title}
                        className="relative w-64 md:w-80 rounded-xl shadow-2xl border border-white/10 rotate-1 group-hover:rotate-0 transition-transform duration-500"
                    />

                    {/* SAV CTA Card */}
                    <div className="absolute -bottom-6 -right-6 md:-right-12 md:top-1/2 md:-translate-y-1/2 z-20 flex flex-col items-center animate-in fade-in zoom-in duration-1000 delay-300">
                        <div className="relative group/card cursor-pointer" title="Allô SAV ?">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl blur opacity-30 group-hover/card:opacity-60 transition duration-500"></div>
                            <div className="relative bg-neutral-900 border border-neutral-800 p-1.5 md:p-2 rounded-2xl flex flex-col items-center gap-2 md:gap-3 w-28 md:w-40 shadow-2xl transform group-hover/card:-translate-y-2 transition duration-300">
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-800">
                                    <img src="/sav-hero.png" alt="Allô SAV" className="w-full h-full object-cover opacity-90 group-hover/card:opacity-100 transition" />
                                </div>
                                <div className="text-center pb-1 md:pb-2">
                                    <p className="text-yellow-400 font-bold text-[9px] md:text-xs tracking-wider uppercase">ALLÔ SAV ?</p>
                                    <p className="text-neutral-400 text-[7px] md:text-[9px] leading-tight mt-0.5">Lâche ton meilleur avis !</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8 flex-1">
                    <div>
                        <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-wider rounded-full mb-4 border border-indigo-500/20 uppercase">
                            {currentMovie.mediaType === 'tv' ? 'SÉRIE DU MOMENT' : 'FILM DU MOMENT'}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight tight-shadow mb-4 leading-tight">
                            {currentMovie.title}
                        </h1>
                        <p className="text-sm text-neutral-500 font-medium">
                            Sortie : {new Date(currentMovie.releaseDate || '').toLocaleDateString('fr-FR', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-start gap-1 w-full">
                        <div className="relative h-20 w-full flex justify-center md:justify-start items-center">
                            <AnimatePresence mode="wait">
                                {step === 'IDLE' && (
                                    <motion.div
                                        key="idle"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.8, opacity: 0, y: 20 }}
                                        className="absolute"
                                    >
                                        <Button
                                            size="lg"
                                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-7 rounded-full shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] transition-all transform hover:scale-105"
                                            onClick={startRecording}
                                        >
                                            <Mic className="mr-3 h-6 w-6 animate-pulse" />
                                            Laisser un avis vocal
                                        </Button>
                                    </motion.div>
                                )}

                                {step === 'REC' && (
                                    <motion.div
                                        key="rec"
                                        initial={{ scale: 0.5, opacity: 0, width: 200 }}
                                        animate={{ scale: 1, opacity: 1, width: 340 }}
                                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                                        className="absolute bg-neutral-900/90 backdrop-blur-md border border-red-500/30 rounded-full flex items-center justify-between p-2 pl-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,1)]" />
                                            <div className="font-mono text-red-400 font-bold tracking-wider w-12">
                                                {formatTime(duration)}
                                            </div>
                                            <div
                                                className="flex-1 h-8 opacity-80 overflow-hidden relative rounded"
                                                style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
                                            >
                                                <AudioVisualizer stream={stream} />
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="rounded-full h-12 w-12 shrink-0 bg-red-600 hover:bg-red-700 shadow-lg ml-3"
                                            onClick={stopRecording}
                                        >
                                            <Square className="h-5 w-5 fill-current" />
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {step === 'IDLE' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Button
                                    variant="outline"
                                    className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-neutral-300 hover:text-white rounded-full px-6 py-5 backdrop-blur-md transition-all shadow-lg"
                                    onClick={() => setOpenSearch(true)}
                                >
                                    <Search className="w-4 h-4 mr-2 text-indigo-400" />
                                    Mon avis sur un autre film !
                                </Button>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            <footer className="absolute bottom-6 text-neutral-600 text-xs">
                SAV du Cinéma &copy; {new Date().getFullYear()}
            </footer>

            {/* Submission Modal */}
            <Dialog open={['PREVIEW', 'SENDING', 'DONE'].includes(step)} onOpenChange={(open) => {
                if (!open && step !== 'SENDING') reset();
            }}>
                <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-white p-0 overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.2)]">
                    <div className="relative h-48 w-full bg-neutral-950 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent z-10" />
                        <img
                            src="/sav-hero.png"
                            alt="SAV du Cinéma"
                            className="w-full h-full object-top object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute bottom-4 left-6 z-20">
                            <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2 backdrop-blur-md">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Casting Vocal
                            </Badge>
                            <h2 className="text-2xl font-black text-white drop-shadow-md">Allô SAV ?</h2>
                        </div>
                    </div>

                    <div className="p-6 pt-2">
                        <AnimatePresence mode="wait">
                            {step === 'PREVIEW' && audioUrl && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                        <img src={currentMovie.posterUrl} className="w-10 h-14 object-cover rounded shadow" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Avis pour</p>
                                            <p className="text-sm font-bold truncate">{currentMovie.title}</p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-neutral-300 leading-relaxed">
                                        Ton avis est enregistré ! Laisse ton pseudo. S'il est sélectionné, il passera peut-être dans le prochain épisode du <strong className="text-white">SAV du Cinéma</strong> ! 🎙️🎬
                                    </p>

                                    <div className="bg-neutral-950 p-3 rounded-2xl border border-neutral-800 flex items-center justify-between shadow-inner">
                                        <Button size="icon" variant="ghost" className="rounded-full shrink-0" onClick={() => reset()}>
                                            <RotateCcw className="h-5 w-5 text-neutral-400 hover:text-white transition-colors" />
                                        </Button>
                                        <audio src={audioUrl} controls className="h-10 w-full ml-3" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-neutral-400 font-medium">Ton Pseudo</Label>
                                        <Input
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Ex: Captain Popcorn"
                                            className="bg-neutral-950 border-neutral-800 h-12 text-lg focus-visible:ring-indigo-500 transition-all"
                                        />
                                    </div>

                                    <Button
                                        className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-900/50 hover:shadow-indigo-900/80 transition-all"
                                        onClick={submitReview}
                                    >
                                        <Send className="h-5 w-5 mr-2" /> Envoyer mon avis
                                    </Button>
                                </motion.div>
                            )}

                            {step === 'SENDING' && (
                                <motion.div key="sending" className="flex flex-col items-center justify-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
                                        <Loader2 className="h-16 w-16 animate-spin text-indigo-400 relative z-10" />
                                    </div>
                                    <p className="mt-6 text-lg font-medium text-neutral-300 animate-pulse">Transmission en cours...</p>
                                </motion.div>
                            )}

                            {step === 'DONE' && (
                                <motion.div key="done" className="flex flex-col items-center text-center py-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse" />
                                        <div className="h-24 w-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl relative z-10">
                                            <CheckCircle2 className="h-12 w-12 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-3xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">Dans la boîte !</h3>
                                    <p className="text-neutral-400 max-w-[280px] mx-auto text-sm leading-relaxed mb-8">
                                        Ton avis a bien été reçu par l'équipe. Croise les doigts pour être dans le prochain épisode ! 🍿
                                    </p>

                                    <div className="w-full space-y-3">
                                        {latestVideoUrl && (
                                            <Button
                                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-12 shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all"
                                                asChild
                                            >
                                                <a href={latestVideoUrl} target="_blank" rel="noreferrer">
                                                    <Play className="h-4 w-4 mr-2 fill-current" />
                                                    Voir le dernier épisode
                                                </a>
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl border-neutral-700 hover:bg-neutral-800 hover:text-white h-12"
                                            onClick={() => reset()}
                                        >
                                            Fermer
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Movie Search Modal */}
            <Dialog open={openSearch} onOpenChange={setOpenSearch}>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-lg p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            <Film className="w-6 h-6 text-indigo-500" />
                            Chercher un autre film
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Tu veux donner ton avis sur quoi aujourd'hui ?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        <form onSubmit={handleSearch} className="relative group">
                            <Input
                                placeholder="Titre du film ou de la série..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-neutral-950 border-neutral-800 h-14 pl-12 pr-4 text-lg rounded-2xl focus-visible:ring-indigo-500 transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-indigo-500 transition-colors" />
                            <Button type="submit" className="hidden">Rechercher</Button>
                        </form>

                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {isSearching ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="mt-2 text-sm text-neutral-500">Recherche en cours...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((item: any) => (
                                    <Card 
                                        key={item.id} 
                                        className="bg-neutral-950/50 border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-900 transition-all cursor-pointer group/item"
                                        onClick={() => selectLocalMovie(item)}
                                    >
                                        <CardContent className="p-3 flex gap-4 items-center">
                                            {item.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                                    alt={item.title || item.name}
                                                    className="w-12 h-18 object-cover rounded-lg shadow-lg"
                                                />
                                            ) : (
                                                <div className="w-12 h-18 bg-neutral-800 rounded-lg flex items-center justify-center text-[10px] text-neutral-500">NO IMG</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[9px] uppercase border-neutral-700 text-neutral-400">
                                                        {item.media_type === 'tv' ? 'Série' : 'Film'}
                                                    </Badge>
                                                    <span className="text-[10px] text-neutral-500">
                                                        {(item.release_date || item.first_air_date)?.split('-')[0]}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-sm text-white truncate group-hover/item:text-indigo-400 transition-colors">
                                                    {item.title || item.name}
                                                </h4>
                                                <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">{item.overview}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-neutral-700 group-hover/item:text-indigo-500 group-hover/item:translate-x-1 transition-all" />
                                        </CardContent>
                                    </Card>
                                ))
                            ) : searchQuery && !isSearching ? (
                                <p className="text-center text-neutral-500 text-sm py-12">Aucun résultat pour "{searchQuery}"</p>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-neutral-600">
                                    <Film className="w-12 h-12 mb-2 opacity-10" />
                                    <p className="text-sm">Tape le nom d'un film pour commencer</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}
