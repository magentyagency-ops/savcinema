'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MovieSearch } from '@/components/admin/movie-search';
import { RecentReviews } from '@/components/admin/recent-reviews';
import { LogOut, Film, BarChart, Settings, Save, ExternalLink, Loader2, Copy } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminDashboard() {
    const [activeMovie, setActiveMovie] = useState<any>(null);
    const [openSearch, setOpenSearch] = useState(false);
    const [latestVideoUrl, setLatestVideoUrl] = useState('');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const copyPublicLink = () => {
        navigator.clipboard.writeText('https://savcinema.vercel.app/');
        toast.success('Lien copié !');
    };

    const fetchActiveMovie = async () => {
        const res = await fetch('/api/admin/active-movie');
        const data = await res.json();
        setActiveMovie(data.activeMovie);
    };

    const fetchSettings = async () => {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.settings?.latestVideoUrl) {
            setLatestVideoUrl(data.settings.latestVideoUrl);
        }
    };

    const saveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latestVideoUrl })
            });
            toast.success('Settings saved');
        } catch (e) {
            toast.error('Failed to save settings');
        } finally {
            setIsSavingSettings(false);
        }
    };

    useEffect(() => {
        fetchActiveMovie();
        fetchSettings();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800 backdrop-blur-sm gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Dashboard</h1>
                    <p className="text-neutral-400 text-xs md:text-sm font-medium">Gestion du SAV du Cinéma</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-neutral-800 pt-4 md:pt-0">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 md:flex-none bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl h-10 md:h-9 transition-all"
                        onClick={copyPublicLink}
                    >
                        <Copy className="h-3.5 w-3.5 mr-2" />
                        <span className="inline">Copier le lien</span>
                    </Button>
                    
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => signOut()} 
                        className="text-neutral-400 hover:text-white hover:bg-red-500/10 hover:text-red-400 rounded-xl h-10 md:h-9 transition-all"
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Déconnexion</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-6">
                    {/* Active Movie Card */}
                    <Card className="bg-neutral-900 border-neutral-800 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-400">
                                <Film className="h-5 w-5" />
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

                    {/* Global Settings Card */}
                    <Card className="bg-neutral-900 border-neutral-800 text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-pink-400">
                                <Settings className="h-5 w-5" />
                                Configuration SAV
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Lien du dernier épisode</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={latestVideoUrl}
                                        onChange={(e) => setLatestVideoUrl(e.target.value)}
                                        placeholder="Lien YouTube/Instagram..."
                                        className="bg-neutral-950 border-neutral-800"
                                    />
                                    {latestVideoUrl && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="shrink-0 text-neutral-400 hover:text-white"
                                            asChild
                                        >
                                            <a href={latestVideoUrl} target="_blank" rel="noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <Button 
                                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white"
                                onClick={saveSettings}
                                disabled={isSavingSettings}
                            >
                                {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Sauvegarder
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats & Reviews */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="bg-neutral-900 border-neutral-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-500">
                                <BarChart className="h-5 w-5" />
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
