"use client";

import { notFound, useParams } from "next/navigation";
import { specialtyData, SpecialtySlug } from "@/lib/specialty-data";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function SpecialtyPortfolio() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const data = specialtyData[slug as SpecialtySlug];

    if (!data || !data.mediaFiles || data.mediaFiles.length === 0) {
        notFound();
    }

    const isVideo = (file: string) => {
        const ext = file.split('.').pop()?.toLowerCase();
        return ext === 'mov' || ext === 'mp4' || ext === 'webm';
    };

    const isYouTube = (file: string) => {
        return file.includes('youtube.com') || file.includes('youtu.be');
    };

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const isExternalLink = (file: string) => {
        return file.startsWith('http') && !isYouTube(file) && !isInstagram(file);
    };

    const isInstagram = (file: string) => {
        return file.includes('instagram.com');
    };

    return (
        <div className="relative w-full min-h-screen pt-32 pb-20 px-6 md:px-16 lg:px-24 flex flex-col items-center">
            <div className="max-w-6xl w-full z-10">
                <div className="mb-12 flex justify-between items-center">
                    <Link href={`/specialty/${slug}`} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm uppercase tracking-widest font-medium group">
                        <i className="ph ph-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                        Back to {data.title}
                    </Link>

                    <Link 
                        href={`/request?team=${slug}`} 
                        className="bg-brand-blue hover:bg-brand-blue/90 text-white px-6 py-3 rounded-md font-semibold tracking-widest uppercase text-xs transition-all flex items-center gap-2"
                    >
                        Start Project
                        <i className="ph ph-arrow-right"></i>
                    </Link>
                </div>

                <div className="mb-16 text-center">
                    <span className="text-brand-green text-xs md:text-sm font-semibold tracking-[0.2em] uppercase mb-4 block">
                        Sample Work
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        {data.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-green">Portfolio.</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.mediaFiles.map((file, index) => {
                        const filePath = `/portfolios/${data.portfolioFolder}/${file}`;
                        
                        return (
                            <div 
                                key={index} 
                                className="bg-wme-panel border border-wme-border rounded-xl overflow-hidden shadow-xl hover:border-brand-blue/50 transition-all duration-300 group flex flex-col"
                            >
                                <div className="relative w-full aspect-video bg-black/50 overflow-hidden flex items-center justify-center">
                                    {isInstagram(file) ? (
                                        <a 
                                            href={file} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 group-hover:scale-105 transition-transform duration-500 p-6 text-white text-center"
                                        >
                                            <i className="ph ph-instagram-logo text-6xl mb-4 drop-shadow-lg"></i>
                                            <h3 className="text-xl md:text-2xl font-bold mb-2 drop-shadow-md">Live Instagram Feed</h3>
                                            <p className="text-sm font-medium opacity-90 drop-shadow-md">@talentearthstudios</p>
                                            <span className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-xs uppercase tracking-widest backdrop-blur-sm transition-colors border border-white/30 drop-shadow-md">
                                                View Profile
                                            </span>
                                        </a>
                                    ) : isYouTube(file) ? (
                                        <iframe 
                                            className="w-full h-full"
                                            src={`https://www.youtube.com/embed/${getYouTubeId(file)}`} 
                                            title="YouTube video player" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                            allowFullScreen
                                        ></iframe>
                                    ) : isExternalLink(file) ? (
                                        <div className="relative w-full h-full group/iframe">
                                            <iframe 
                                                className="w-full h-full bg-white"
                                                src={file} 
                                                title="External Portfolio Link" 
                                                frameBorder="0"
                                                allowFullScreen
                                            ></iframe>
                                            <a 
                                                href={file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute bottom-4 right-4 bg-black/70 hover:bg-brand-blue text-white p-3 rounded-full opacity-0 group-hover/iframe:opacity-100 transition-all duration-300 z-10 flex items-center justify-center backdrop-blur-sm shadow-lg hover:scale-110 border border-white/20 hover:border-transparent"
                                                title="Play Full Screen"
                                            >
                                                <i className="ph ph-corners-out text-xl"></i>
                                            </a>
                                        </div>
                                    ) : isVideo(file) ? (
                                        <video 
                                            src={filePath} 
                                            controls 
                                            preload="none"
                                            className="w-full h-full object-contain"
                                            poster=""
                                        />
                                    ) : (
                                        <div 
                                            className="relative w-full h-full cursor-zoom-in"
                                            onClick={() => setSelectedImage(filePath)}
                                        >
                                            <Image 
                                                src={filePath} 
                                                alt={`Portfolio Sample ${index + 1}`} 
                                                fill 
                                                className="object-contain group-hover:scale-105 transition-transform duration-500"
                                                unoptimized
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Full-screen Image Modal */}
            {mounted && selectedImage && createPortal(
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8 cursor-zoom-out backdrop-blur-sm"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative w-full h-full max-w-7xl">
                        <Image 
                            src={selectedImage} 
                            alt="Full size view" 
                            fill 
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                    <button 
                        className="absolute top-6 right-6 text-white hover:text-brand-blue transition-colors z-[110] bg-black/50 p-3 rounded-full border border-white/20 hover:scale-110"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                        }}
                        title="Close Full Screen"
                    >
                        <i className="ph ph-x text-2xl"></i>
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}
