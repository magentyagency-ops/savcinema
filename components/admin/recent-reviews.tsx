'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Check, Trash2, Tag, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Review {
    id: string;
    status: 'NEW' | 'APPROVED' | 'ARCHIVED' | 'REJECTED';
    durationSec: number;
    displayName: string | null;
    createdAt: string;
    audioUrl: string;
    tags: string[];
}

export function RecentReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
            const data = await res.json();
            setReviews(data.reviews || []);
        } catch (e) {
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const togglePlay = (url: string, id: string) => {
        if (playingId === id && audio) {
            audio.pause();
            setPlayingId(null);
            return;
        }

        if (audio) {
            audio.pause();
        }

        const newAudio = new Audio(url);
        newAudio.onended = () => setPlayingId(null);
        newAudio.play();
        setAudio(newAudio);
        setPlayingId(id);
    };

    const updateStatus = async (id: string, status: string) => {
        // Optimistic update
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r));

        try {
            await fetch(`/api/admin/reviews/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            toast.success(`Review marked as ${status}`);
        } catch (e) {
            toast.error('Failed to update status');
            fetchReviews(); // Revert
        }
    };

    const deleteReview = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        setReviews(prev => prev.filter(r => r.id !== id));

        try {
            await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
            toast.success('Review deleted');
        } catch (e) {
            toast.error('Failed to delete');
            fetchReviews();
        }
    };

    if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
                <Card key={review.id} className="bg-neutral-900 border-neutral-800 text-white overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="font-semibold text-sm">{review.displayName || 'Anonymous'}</p>
                                <p className="text-xs text-neutral-400">{formatDistanceToNow(new Date(review.createdAt))} ago</p>
                            </div>
                            <Badge variant={review.status === 'NEW' ? 'default' : 'secondary'} className={review.status === 'NEW' ? 'bg-indigo-600' : ''}>
                                {review.status}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-3 mb-4 bg-neutral-950 p-2 rounded-lg border border-neutral-800">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full hover:bg-neutral-800 hover:text-white"
                                onClick={() => togglePlay(review.audioUrl, review.id)}
                            >
                                {playingId === review.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <div className="text-xs font-mono text-neutral-400">
                                {Math.floor(review.durationSec / 60)}:{(review.durationSec % 60).toString().padStart(2, '0')}
                            </div>
                            <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                <div className={`h-full bg-indigo-500 ${playingId === review.id ? 'animate-pulse' : ''} w-1/2`} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            {review.status === 'NEW' && (
                                <Button size="sm" variant="outline" className="h-7 text-xs border-neutral-700 hover:bg-neutral-800 hover:text-green-500" onClick={() => updateStatus(review.id, 'APPROVED')}>
                                    <Check className="h-3 w-3 mr-1" /> Approve
                                </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-neutral-800 hover:text-red-500" onClick={() => deleteReview(review.id)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {reviews.length === 0 && <p className="col-span-full text-center text-neutral-500 py-10">No reviews yet.</p>}
        </div>
    );
}
