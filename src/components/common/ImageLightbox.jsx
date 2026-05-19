import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageLightbox({ images, initialIndex = 0, onClose }) {
    const [current, setCurrent] = React.useState(initialIndex);

    React.useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length);
            if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [images, onClose]);

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            <button 
                className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                onClick={onClose}
            >
                <X className="w-5 h-5" />
            </button>

            {images.length > 1 && (
                <>
                    <button
                        className="absolute left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length); }}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        className="absolute right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length); }}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            <img
                src={images[current]}
                alt={`Foto ${current + 1}`}
                className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
                <div className="absolute bottom-4 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
                    {current + 1} / {images.length}
                </div>
            )}
        </div>
    );
}