'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { ReviewDrawer } from '@/components/public/review-drawer';

export default function HomeClient({ movie }: { movie: any }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg px-8 py-6 rounded-full shadow-lg shadow-indigo-900/20 hover:scale-105 transition-transform"
                onClick={() => setIsOpen(true)}
            >
                <Mic className="mr-2 h-5 w-5" />
                Laisser un avis vocal
            </Button>

            <ReviewDrawer
                movieId={movie.id}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
