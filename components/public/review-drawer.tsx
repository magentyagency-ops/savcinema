'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mic, Square, Play, RotateCcw, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioVisualizer } from '@/components/ui/visualizer';
import { toast } from 'sonner';
import ky from 'ky';

interface ReviewDrawerProps {
    movieId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ReviewDrawer({ movieId, isOpen, onClose }: ReviewDrawerProps) {
    const [step, setStep] = useState<'REC' | 'PREVIEW' | 'SENDING' | 'DONE'>('REC');
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

            recorder.onstop = () => {
                // Blob calculation happens in useEffect when chunks change or explicitly here if needed.
                // We will process chunks in the 'stop' handler logic or effect.
            };

            recorder.start();
            setIsRecording(true);

            // Timer
            let sec = 0;
            setDuration(0);
            timerRef.current = setInterval(() => {
                sec++;
                setDuration(sec);
                if (sec >= 90) stopRecording(); // Max 90s
            }, 1000);

        } catch (err) {
            console.error(err);
            toast.error('Could not access microphone');
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
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        }
    }, [chunks, isRecording, step]);

    const reset = () => {
        setChunks([]);
        setAudioUrl(null);
        setDuration(0);
        setStep('REC');
    };

    const submitReview = async () => {
        if (!displayName.trim()) {
            toast.error('Please enter a pseudo');
            return;
        }

        try {
            const blob = new Blob(chunks, { type: 'audio/webm' });

            const formData = new FormData();
            formData.append('movieId', movieId);
            formData.append('audioFile', blob, 'review.webm');
            formData.append('durationSec', duration.toString());
            if (displayName) formData.append('displayName', displayName);

            await ky.post('/api/public/reviews-simple', {
                body: formData,
                timeout: 60000
            });

            setStep('DONE');
            toast.success('Review sent!');

        } catch (err) {
            console.error(err);
            toast.error('Upload failed');
            setStep('PREVIEW');
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="bottom" className="h-[90vh] sm:h-auto sm:rounded-t-xl bg-neutral-900 border-neutral-800 text-white p-6">
                <SheetHeader>
                    <SheetTitle>Leave a Voice Review</SheetTitle>
                    <SheetDescription className="text-neutral-400">
                        Share your thoughts on the movie in under 90 seconds.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-8 flex flex-col items-center justify-center space-y-8">
                    <AnimatePresence mode="wait">
                        {step === 'REC' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                className="flex flex-col items-center gap-4 w-full"
                            >
                                <div className="text-4xl font-mono font-bold tracking-widest text-indigo-400">
                                    {formatTime(duration)}
                                </div>

                                {isRecording ? (
                                    <div className="w-full max-w-sm">
                                        <AudioVisualizer stream={stream} />
                                    </div>
                                ) : (
                                    <div className="h-[60px] w-full flex items-center justify-center text-neutral-500 text-sm">
                                        Press microphone to start
                                    </div>
                                )}

                                <Button
                                    size="lg"
                                    variant={isRecording ? "destructive" : "default"}
                                    className={`h-20 w-20 rounded-full transition-all ${isRecording ? "animate-pulse" : ""}`}
                                    onClick={isRecording ? stopRecording : startRecording}
                                >
                                    {isRecording ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-8 w-8" />}
                                </Button>
                            </motion.div>
                        )}

                        {step === 'PREVIEW' && audioUrl && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="w-full max-w-md space-y-6"
                            >
                                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                                    <Button size="icon" variant="ghost" className="rounded-full" onClick={() => reset()}>
                                        <RotateCcw className="h-5 w-5 text-neutral-400" />
                                    </Button>
                                    <audio src={audioUrl} controls className="h-8" />
                                </div>

                                <div className="space-y-2">
                                    <Label>Your Pseudo</Label>
                                    <Input
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Captain Popcorn"
                                        className="bg-neutral-950 border-neutral-800"
                                    />
                                </div>

                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" size="lg" onClick={submitReview}>
                                    <Send className="h-4 w-4 mr-2" /> Send Review
                                </Button>
                            </motion.div>
                        )}

                        {step === 'SENDING' && (
                            <motion.div className="flex flex-col items-center">
                                <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mb-4" />
                                <p>Uploading your voice...</p>
                            </motion.div>
                        )}

                        {step === 'DONE' && (
                            <motion.div className="flex flex-col items-center text-center space-y-4">
                                <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold">Thank You!</h3>
                                <p className="text-neutral-400 max-w-xs">Your review has been sent to the moderation team.</p>
                                <Button variant="outline" onClick={onClose}>Close</Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </SheetContent>
        </Sheet>
    );
}
