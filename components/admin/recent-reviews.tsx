'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Check, Trash2, Tag, Loader2, Download, Film, ChevronDown, ChevronRight } from 'lucide-react';
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
    movie?: {
        id: string;
        title: string;
        posterUrl: string | null;
    };
}

export function RecentReviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const fetchReviews = async () => {
        try {
            const res = await fetch('/api/admin/reviews', { cache: 'no-store' });
            const data = await res.json();
            setReviews(data.reviews || []);
            
            // Expand the first group by default
            if (data.reviews && data.reviews.length > 0) {
                const firstMovieId = data.reviews[0].movie?.id || 'unknown';
                setExpandedGroups(prev => ({ ...prev, [firstMovieId]: true }));
            }
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

    const handleDownload = (url: string, id: string) => {
        toast.info('Lancement du téléchargement...', { id: `dl-${id}` });
        window.location.href = `/api/admin/download?url=${encodeURIComponent(url)}&id=${id}`;
        setTimeout(() => toast.success('Téléchargement lancé', { id: `dl-${id}` }), 1500);
    };

    const toggleGroup = (movieId: string) => {
        setExpandedGroups(prev => ({ ...prev, [movieId]: !prev[movieId] }));
    };

    if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

    // Group reviews by movie
    const groupedReviews = reviews.reduce((acc, review) => {
        const movieId = review.movie?.id || 'unknown';
        if (!acc[movieId]) {
            acc[movieId] = {
                movie: review.movie,
                reviews: []
            };
        }
        acc[movieId].reviews.push(review);
        return acc;
    }, {} as Record<string, { movie: any, reviews: Review[] }>);

    return (
        <div className="space-y-6">
            {Object.values(groupedReviews).map((group, index) => {
                const groupId = group.movie?.id || 'unknown';
                const isExpanded = expandedGroups[groupId];
                
                return (
                    <div key={groupId} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
                        {/* Header / Accordion Toggle */}
                        <div 
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-800/50 transition-colors"
                            onClick={() => toggleGroup(groupId)}
                        >
                            <div className="flex items-center gap-4">
                                {group.movie?.posterUrl ? (
                                    <img src={group.movie.posterUrl} alt={group.movie.title} className="w-10 h-14 object-cover rounded shadow" />
                                ) : (
                                    <div className="w-10 h-14 bg-neutral-800 rounded flex items-center justify-center shadow">
                                        <Film className="w-5 h-5 text-neutral-500" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-white">{group.movie?.title || 'Film Inconnu'}</h3>
                                    <Badge variant="outline" className="mt-1 border-neutral-700 text-neutral-400">
                                        {group.reviews.length} avis vocal{group.reviews.length > 1 ? 's' : ''}
                                    </Badge>
                                </div>
                            </div>
                            <div className="text-neutral-500 mr-2">
                                {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                            </div>
                        </div>

                        {/* Reviews List */}
                        {isExpanded && (
                            <div className="p-4 pt-0 border-t border-neutral-800 bg-neutral-950/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {group.reviews.map((review) => (
                                        <Card key={review.id} className="bg-neutral-900 border-neutral-800 text-white overflow-hidden shadow-sm">
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
                                                        className="h-8 w-8 rounded-full hover:bg-neutral-800 hover:text-white shrink-0"
                                                        onClick={() => togglePlay(review.audioUrl, review.id)}
                                                    >
                                                        {playingId === review.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                    </Button>
                                                    <div className="text-xs font-mono text-neutral-400 shrink-0">
                                                        {Math.floor(review.durationSec / 60)}:{(review.durationSec % 60).toString().padStart(2, '0')}
                                                    </div>
                                                    <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                                                        <div className={`h-full bg-indigo-500 ${playingId === review.id ? 'animate-pulse' : ''} w-1/2`} />
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 rounded-full hover:bg-neutral-800 hover:text-white shrink-0"
                                                        onClick={() => handleDownload(review.audioUrl, review.id)}
                                                        title="Télécharger l'audio"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
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
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            {reviews.length === 0 && <p className="text-center text-neutral-500 py-10">No reviews yet.</p>}
        </div>
    );
}
