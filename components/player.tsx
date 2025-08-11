"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
    Shuffle, Repeat, Repeat1, X, Maximize2, Minimize2,
    Heart, MoreHorizontal, Clock, Music, Download
} from "lucide-react";
import usePlayerStore, { usePlayerActions } from "@/store/player-store";
import { cn } from "@/lib/utils";

// Optimized animation variants
const playerVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
    },
    exit: {
        y: 100,
        opacity: 0,
    }
};

const volumeSliderVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
    },
    exit: {
        opacity: 0,
        y: 10,
        scale: 0.95,
    }
};

// Memoized playing indicator component
const PlayingIndicator = ({ isPlaying }: { isPlaying: boolean }) => {
    if (!isPlaying) return null;

    return (
        <motion.div
            className="absolute inset-0 bg-black/20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="flex space-x-1">
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-1 h-3 bg-white rounded-full"
                        animate={{
                            scaleY: [0.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
};

export default function Player() {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        currentTrack, isPlaying, currentTime, duration, volume, isMuted,
        isShuffled, repeatMode, isPlayerVisible, likedTracks, setIsPlaying, setCurrentTime,
        setDuration, setVolume, setIsMuted, setIsShuffled, setRepeatMode,
        playNext, playPrevious, setIsPlayerVisible,
    } = usePlayerStore();

    const { toggleLikedTrack, incrementDownloadCount } = usePlayerActions();

    // Memoized formatted time
    const formattedCurrentTime = useMemo(() => {
        if (isNaN(currentTime)) return "0:00";
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [currentTime]);

    const formattedDuration = useMemo(() => {
        if (isNaN(duration)) return "0:00";
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [duration]);

    // Memoized progress percentage
    const progressPercentage = useMemo(() => {
        return duration ? (currentTime / duration) * 100 : 0;
    }, [currentTime, duration]);

    // Optimized event handlers
    const handleTimeUpdate = useCallback(() => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }, [setCurrentTime]);

    const handleLoadedMetadata = useCallback(() => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setIsLoading(false);
        }
    }, [setDuration, setIsLoading]);

    const handleEnded = useCallback(() => {
        if (repeatMode === 'one' && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
        } else {
            playNext();
        }
    }, [repeatMode, playNext]);

    const handleError = useCallback((e: Event) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setIsLoading(false);
    }, [setIsPlaying, setIsLoading]);

    const handleLoadStart = useCallback(() => {
        setIsLoading(true);
    }, [setIsLoading]);

    const handleCanPlay = useCallback(() => {
        setIsLoading(false);
    }, [setIsLoading]);

    // Audio event listeners
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [handleTimeUpdate, handleLoadedMetadata, handleEnded, handleError, handleLoadStart, handleCanPlay]);

    // Play/pause effect
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        const playAudio = async () => {
            try {
                await audio.play();
            } catch (error) {
                console.error('Failed to play audio:', error);
                setIsPlaying(false);
            }
        };

        if (isPlaying) {
            playAudio();
        } else {
            audio.pause();
        }
    }, [isPlaying, currentTrack, setIsPlaying]);

    // Volume effect
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    // Track change effect
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        setIsLoading(true);
        audio.pause();
        audio.currentTime = 0;
        audio.src = currentTrack.url;
        audio.load();
    }, [currentTrack, setIsLoading]);

    // Optimized event handlers
    const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        setCurrentTime(newTime);
    }, [setCurrentTime]);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
        }
    }, [setVolume, setIsMuted, isMuted]);

    const toggleMute = useCallback(() => {
        setIsMuted(!isMuted);
    }, [isMuted, setIsMuted]);

    const toggleShuffle = useCallback(() => {
        setIsShuffled(!isShuffled);
    }, [isShuffled, setIsShuffled]);

    const toggleRepeatMode = useCallback(() => {
        const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setRepeatMode(modes[nextIndex]);
    }, [repeatMode, setRepeatMode]);

    const handlePlayPause = useCallback(() => {
        if (!currentTrack) return;
        setIsPlaying(!isPlaying);
    }, [currentTrack, isPlaying, setIsPlaying]);

    const handleMinimizeToggle = useCallback(() => {
        setIsMinimized(!isMinimized);
    }, [isMinimized]);

    const handleClose = useCallback(() => {
        setIsPlayerVisible(false);
    }, [setIsPlayerVisible]);

    const handleLikeToggle = useCallback(() => {
        if (!currentTrack) return;
        toggleLikedTrack(currentTrack.id);
    }, [currentTrack, toggleLikedTrack]);

    if (!isPlayerVisible || !currentTrack) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-white/20 dark:border-white/10",
                    isMinimized ? "h-16" : "h-24"
                )}
                variants={playerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{
                    type: "spring",
                    damping: 25,
                    stiffness: 200,
                }}
            >
                {/* Hidden audio element */}
                <audio ref={audioRef} preload="metadata" />

                <div className="container mx-auto px-4 h-full">
                    <div className="flex items-center justify-between h-full">
                        {/* Track Info */}
                        <motion.div
                            className="flex items-center space-x-4 flex-1 min-w-0"
                            layout
                        >
                            {/* Thumbnail */}
                            <motion.div
                                className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                {currentTrack.thumbnail ? (
                                    <img
                                        src={currentTrack.thumbnail}
                                        alt={currentTrack.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                        <Music className="h-6 w-6 text-primary" />
                                    </div>
                                )}

                                <PlayingIndicator isPlaying={isPlaying} />
                            </motion.div>

                            {/* Track details */}
                            <div className="flex-1 min-w-0">
                                <motion.h3
                                    className="font-medium text-foreground truncate"
                                    layout
                                >
                                    {currentTrack.title}
                                </motion.h3>
                                <motion.p
                                    className="text-sm text-muted-foreground truncate"
                                    layout
                                >
                                    {currentTrack.artist || "Unknown Artist"}
                                </motion.p>
                            </div>
                        </motion.div>

                        {/* Controls */}
                        <motion.div
                            className="flex items-center space-x-4"
                            layout
                        >
                            {/* Time display */}
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <span>{formattedCurrentTime}</span>
                                <span>/</span>
                                <span>{formattedDuration}</span>
                            </div>

                            {/* Player controls */}
                            <div className="flex items-center space-x-2">
                                {/* Shuffle */}
                                <button
                                    onClick={toggleShuffle}
                                    className={cn(
                                        "p-2 rounded-md transition-colors",
                                        isShuffled ? "text-gradient bg-gradient-to-r from-rose-500/10 to-orange-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                    )}
                                >
                                    <Shuffle className="h-4 w-4" />
                                </button>

                                {/* Previous */}
                                <button
                                    onClick={playPrevious}
                                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                >
                                    <SkipBack className="h-4 w-4" />
                                </button>

                                {/* Play/Pause */}
                                <motion.button
                                    onClick={handlePlayPause}
                                    disabled={isLoading}
                                    className={cn(
                                        "p-3 rounded-full transition-all duration-300",
                                        isLoading
                                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                                            : "bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-lg hover:scale-105"
                                    )}
                                    whileHover={!isLoading ? { scale: 1.05 } : {}}
                                    whileTap={!isLoading ? { scale: 0.95 } : {}}
                                >
                                    {isLoading ? (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    ) : isPlaying ? (
                                        <Pause className="h-5 w-5" />
                                    ) : (
                                        <Play className="h-5 w-5" />
                                    )}
                                </motion.button>

                                {/* Next */}
                                <button
                                    onClick={playNext}
                                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                >
                                    <SkipForward className="h-4 w-4" />
                                </button>

                                {/* Repeat */}
                                <button
                                    onClick={toggleRepeatMode}
                                    className={cn(
                                        "p-2 rounded-md transition-colors",
                                        repeatMode !== 'none' ? "text-gradient bg-gradient-to-r from-rose-500/10 to-orange-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                    )}
                                >
                                    {repeatMode === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                                </button>
                            </div>
                        </motion.div>

                        {/* Right side controls */}
                        <motion.div
                            className="flex items-center space-x-2"
                            layout
                        >
                            {/* Like */}
                            <button
                                onClick={handleLikeToggle}
                                className={cn(
                                    "p-2 rounded-md transition-colors",
                                    likedTracks.includes(currentTrack.id) ? "text-red-500 hover:bg-red-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                )}
                            >
                                <Heart className={cn("h-4 w-4", likedTracks.includes(currentTrack.id) && "fill-current")} />
                            </button>

                            {/* Download */}
                            <button
                                onClick={() => {
                                    incrementDownloadCount();
                                    const link = document.createElement('a');
                                    link.href = currentTrack.url;
                                    link.download = `${currentTrack.title}.mp3`;
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                            </button>

                            {/* Volume */}
                            <div className="relative">
                                <button
                                    onClick={toggleMute}
                                    onMouseEnter={() => setShowVolumeSlider(true)}
                                    onMouseLeave={() => setShowVolumeSlider(false)}
                                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                >
                                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </button>

                                {/* Volume slider */}
                                <AnimatePresence>
                                    {showVolumeSlider && (
                                        <motion.div
                                            className="absolute bottom-full right-0 mb-2 p-2 glass-effect rounded-lg shadow-lg"
                                            variants={volumeSliderVariants}
                                            initial="hidden"
                                            animate="visible"
                                            exit="exit"
                                            transition={{
                                                duration: 0.2,
                                                ease: "easeOut"
                                            }}
                                            onMouseEnter={() => setShowVolumeSlider(true)}
                                            onMouseLeave={() => setShowVolumeSlider(false)}
                                        >
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.01"
                                                value={isMuted ? 0 : volume}
                                                onChange={handleVolumeChange}
                                                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                                                style={{
                                                    background: `linear-gradient(to right, hsl(var(--color-rose)) 0%, hsl(var(--color-rose)) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                                                }}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* More options */}
                            <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {/* Minimize/Maximize */}
                            <button
                                onClick={handleMinimizeToggle}
                                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                            >
                                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                            </button>

                            {/* Close */}
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </motion.div>
                    </div>

                    {/* Progress bar - only show when not minimized */}
                    {!isMinimized && (
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 h-2 bg-white/10"
                            layout
                        >
                            <div className="relative h-full">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleProgressChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div
                                    className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all duration-100 rounded-r-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}