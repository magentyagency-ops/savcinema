'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Media {
    id: number;
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path: string | null;
    overview: string;
    media_type: 'movie' | 'tv';
}

export function MovieSearch({ onSelect }: { onSelect: () => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Media[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setSearching(true);
        try {
            const res = await fetch(`/api/admin/movies/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setResults(data.results || []);
        } catch (err) {
            toast.error('Failed to search');
        } finally {
            setSearching(false);
        }
    };

    const handleSelect = async (tmdbId: number, mediaType: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/active-movie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tmdbId, mediaType }),
            });

            if (!res.ok) throw new Error('Failed to set active media');

            toast.success('Active media updated!');
            onSelect();
        } catch (error) {
            toast.error('Error updating active media');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 pt-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                    placeholder="Search for a movie or TV show..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-neutral-900 border-neutral-800"
                />
                <Button type="submit" disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </form>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {results.map((item) => (
                    <Card key={item.id} className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors">
                        <CardContent className="p-3 flex gap-4 items-start">
                            {item.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                    alt={item.title || item.name}
                                    className="w-12 h-18 object-cover rounded bg-neutral-800"
                                />
                            ) : (
                                <div className="w-12 h-18 bg-neutral-800 rounded flex items-center justify-center text-xs text-neutral-500">No Img</div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-sm text-white truncate max-w-[200px]">{item.title || item.name}</h4>
                                    <span className="text-[10px] uppercase bg-neutral-800 text-neutral-400 px-1 rounded">{item.media_type}</span>
                                </div>
                                <div className="flex items-center text-xs text-neutral-400 mt-1">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {(item.release_date || item.first_air_date)?.split('-')[0] || 'Unknown'}
                                </div>
                                <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{item.overview}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={loading}
                                onClick={() => handleSelect(item.id, item.media_type)}
                            >
                                Select
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                {results.length === 0 && query && !searching && (
                    <p className="text-center text-neutral-500 text-sm py-4">No results found</p>
                )}
            </div>
        </div>
    );
}
