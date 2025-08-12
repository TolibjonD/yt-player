"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Music,
    Play,
    Heart,
    Download,
    Youtube
} from "lucide-react";
import Header from "@/components/header";
import UrlInput from "@/components/url-input";
import { Player } from "@/components/player";
import Playlist from "@/components/playlist";
import { cn } from "@/lib/utils";
import { usePlayerState } from "@/store/hooks";

// Optimized animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
    },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
    },
    hover: {
        scale: 1.02,
        y: -4,
    },
};

// Loading component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64">
        <div className="relative">
            <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-16 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
        </div>
    </div>
);

// Stats component with store integration
function StatsCards() {
    // Use Redux selectors
    const playerState = usePlayerState();
    const { currentPlaylist, playlists, likedTracks, downloadCount } = playerState;

    // Calculate stats even when no playlists exist
    const totalTracks = currentPlaylist ? currentPlaylist.tracks.length :
        playlists.reduce((total: number, playlist: any) => total + playlist.tracks.length, 0);
    const totalPlaylists = playlists.length;
    const totalLikedTracks = likedTracks.length;

    const statsData = [
        { icon: Music, label: "Total Tracks", value: totalTracks.toString(), color: "text-gradient", bgColor: "from-rose-500/20 to-orange-500/20" },
        { icon: Play, label: "Playlists", value: totalPlaylists.toString(), color: "text-green-500", bgColor: "from-green-500/20 to-emerald-500/20" },
        { icon: Heart, label: "Liked Tracks", value: totalLikedTracks.toString(), color: "text-rose-500", bgColor: "from-rose-500/20 to-pink-500/20" },
        { icon: Download, label: "Downloads", value: downloadCount.toString(), color: "text-purple-500", bgColor: "from-purple-500/20 to-violet-500/20" }
    ];

    return (
        <>
            {statsData.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    className="text-center p-4 rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm"
                    variants={cardVariants}
                    whileHover="hover"
                    transition={{
                        delay: index * 0.1,
                        duration: 0.4,
                    }}
                >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-gradient-to-br", stat.bgColor)}>
                        <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div className={cn("text-2xl font-bold mb-1", stat.color)}>{stat.value}</div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                </motion.div>
            ))}
        </>
    );
}

// Features component
function FeaturesCards() {
    const featuresData = [
        {
            icon: Youtube,
            title: "YouTube to MP3",
            description: "Convert any YouTube video to high-quality MP3 audio instantly",
            color: "text-red-500",
            bgColor: "from-red-500/20 to-pink-500/20"
        },
        {
            icon: Music,
            title: "Smart Playlists",
            description: "Organize your music with intelligent playlist management",
            color: "text-blue-500",
            bgColor: "from-blue-500/20 to-indigo-500/20"
        },
        {
            icon: Download,
            title: "Offline Access",
            description: "Download and enjoy your music without internet connection",
            color: "text-green-500",
            bgColor: "from-green-500/20 to-emerald-500/20"
        },
        {
            icon: Heart,
            title: "Favorites",
            description: "Save and organize your favorite tracks with ease",
            color: "text-purple-500",
            bgColor: "from-purple-500/20 to-violet-500/20"
        }
    ];

    return (
        <>
            {featuresData.map((feature, index) => (
                <motion.div
                    key={feature.title}
                    className="p-4 rounded-lg bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm"
                    variants={cardVariants}
                    whileHover="hover"
                    transition={{
                        delay: index * 0.1,
                        duration: 0.4,
                    }}
                >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-gradient-to-br", feature.bgColor)}>
                        <feature.icon className={cn("h-5 w-5", feature.color)} />
                    </div>
                    <h3 className="font-semibold mb-2 text-white">{feature.title}</h3>
                    <p className="text-sm text-white/70">{feature.description}</p>
                </motion.div>
            ))}
        </>
    );
}

export default function HomeClient() {
    const [activeTab, setActiveTab] = useState<'input' | 'playlist'>('input');
    const [isHydrated, setIsHydrated] = useState(false);

    // Fix hydration mismatch
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Don't render until hydrated to prevent mismatch
    if (!isHydrated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center h-64">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-12 h-16 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header />
            <Player />

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 pb-32 sm:pb-8">
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.5 }}
                >
                    {/* Left Column - URL Input */}
                    <motion.div
                        className="lg:col-span-1"
                        variants={itemVariants}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="lg:col-span-1">
                            <div className="sticky top-24">
                                <UrlInput />
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column - Playlist & Stats */}
                    <motion.div
                        className="lg:col-span-2"
                        variants={itemVariants}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {/* Tab Navigation */}
                        <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 mb-6">
                            <button
                                onClick={() => setActiveTab('input')}
                                className={cn(
                                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200",
                                    activeTab === 'input'
                                        ? "bg-white/20 text-white shadow-lg"
                                        : "text-white/70 hover:text-white hover:bg-white/10"
                                )}
                            >
                                Playlist
                            </button>
                            <button
                                onClick={() => setActiveTab('playlist')}
                                className={cn(
                                    "flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200",
                                    activeTab === 'playlist'
                                        ? "bg-white/20 text-white shadow-lg"
                                        : "text-white/70 hover:text-white hover:bg-white/10"
                                )}
                            >
                                Stats & Features
                            </button>
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'input' ? (
                                <motion.div
                                    key="playlist"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="glass-effect rounded-xl p-6"
                                >
                                    <Playlist />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="stats"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    {/* Quick Stats */}
                                    <div className="glass-effect rounded-xl p-6">
                                        <h2 className="text-xl font-bold mb-4 text-gradient">Quick Stats</h2>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <StatsCards />
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="glass-effect rounded-xl p-6">
                                        <h2 className="text-xl font-bold mb-4 text-gradient">Features</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FeaturesCards />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </main>
        </>
    );
}
