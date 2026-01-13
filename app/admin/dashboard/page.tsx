'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MovieSearch } from '@/components/admin/movie-search';
import { RecentReviews } from '@/components/admin/recent-reviews';
import { LogOut, Film, BarChart } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Separator } from '@/components/ui/separator';

export default function AdminDashboard() {
    const [activeMovie, setActiveMovie] = useState<any>(null);
    const [openSearch, setOpenSearch] = useState(false);

    const fetchActiveMovie = async () => {
        const res = await fetch('/api/admin/active-movie');
        const data = await res.json();
        setActiveMovie(data.activeMovie);
    };

    useEffect(() => {
        fetchActiveMovie();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
                    <p className="text-neutral-400">Manage active movie and voice reviews.</p>
                </div>
                <Button variant="outline" className="border-neutral-700 hover:bg-neutral-800" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Movie Card */}
                <Card className="md:col-span-1 bg-neutral-900 border-neutral-800 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Film className="h-5 w-5 text-indigo-500" />
                            Active Movie
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeMovie ? (
                            <div className="space-y-4">
                                <div className="aspect-[2/3] w-full rounded-xl overflow-hidden relative group">
                                    <img
                                        src={activeMovie.posterUrl || ''}
                                        alt={activeMovie.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                        <h3 className="text-xl font-bold">{activeMovie.title}</h3>
                                        <p className="text-sm text-neutral-300 line-clamp-2">{activeMovie.overview}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Dialog open={openSearch} onOpenChange={setOpenSearch}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full bg-white text-black hover:bg-neutral-200">
                                                Change Movie
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="bg-neutral-950 border-neutral-800 text-white">
                                            <DialogHeader>
                                                <DialogTitle>Select Active Movie</DialogTitle>
                                            </DialogHeader>
                                            <MovieSearch onSelect={() => {
                                                fetchActiveMovie();
                                                setOpenSearch(false);
                                            }} />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-neutral-800 rounded-xl p-8 text-center">
                                <p className="text-neutral-500 mb-4">No active movie selected</p>
                                <Dialog open={openSearch} onOpenChange={setOpenSearch}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary">Select Movie</Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-neutral-950 border-neutral-800 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Select Active Movie</DialogTitle>
                                        </DialogHeader>
                                        <MovieSearch onSelect={() => {
                                            fetchActiveMovie();
                                            setOpenSearch(false);
                                        }} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Stats & Reviews */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart className="h-5 w-5 text-emerald-500" />
                                Recent Voice Reviews
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RecentReviews />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
