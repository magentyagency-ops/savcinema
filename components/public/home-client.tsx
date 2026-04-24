'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, RotateCcw, Send, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioVisualizer } from '@/components/ui/visualizer';
import { toast } from 'sonner';
import ky from 'ky';

export default function HomeClient({ movie }: { movie: any }) {
    const [step, setStep] = useState<'IDLE' | 'REC' | 'PREVIEW' | 'SENDING' | 'DONE'>('IDLE');
    const [isRecording, setIsRecording] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [chunks, setChunks] = useState<Blob[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [displayName, setDisplayName] = useState('');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
            formData.append('movieId', movie.id);
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

    return (
        <div className="relative w-full flex justify-center items-center h-24">
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

            <Dialog open={['PREVIEW', 'SENDING', 'DONE'].includes(step)} onOpenChange={(open) => {
                if (!open && step !== 'SENDING') reset();
            }}>
                <DialogContent className="sm:max-w-md bg-neutral-900 border-neutral-800 text-white p-0 overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.2)]">
                    {/* Header Image Area */}
                    <div className="relative h-48 w-full bg-neutral-950 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent z-10" />
                        <img 
                            src="/sav-hero.png" 
                            alt="SAV du Cinéma" 
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
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
                                    <Button 
                                        variant="outline" 
                                        className="w-full rounded-xl border-neutral-700 hover:bg-neutral-800 hover:text-white"
                                        onClick={() => reset()}
                                    >
                                        Fermer
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
