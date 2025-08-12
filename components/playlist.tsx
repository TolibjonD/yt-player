"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import Image from 'next/image';
import {
    Play,
    Pause,
    Trash2,
    MoreHorizontal,
    Clock,
    Music,
    Heart,
    Download,
    Share2,
    Plus,
    List,
    Grid3X3,
    X
} from "lucide-react";
import { Track } from "@/store/playerSlice";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { removeTrack, setCurrentTrack, setIsPlaying, toggleLikedTrack, incrementDownloadCount } from "@/store/playerSlice";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface PlaylistProps {
    onTrackLike?: (trackId: string) => void;
    onTrackDownload?: () => void;
    likedTracks?: string[];
}

export default function Playlist({
    onTrackLike,
    onTrackDownload,
    likedTracks = []
}: PlaylistProps) {
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
    const [showOptions, setShowOptions] = useState<string | null>(null);
    const [showMobileMenu, setShowMobileMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Use store selectors
    // Redux selectors and dispatch
    const dispatch = useAppDispatch();
    const currentPlaylist = useAppSelector((state) => state.player.currentPlaylist);
    const currentTrack = useAppSelector((state) => state.player.currentTrack);
    const isPlaying = useAppSelector((state) => state.player.isPlaying);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowOptions(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!currentPlaylist) {
        return (
            <motion.div
                className="flex flex-col items-center justify-center py-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <List className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Playlist Selected</h3>
                <p className="text-muted-foreground max-w-md">
                    Create a new playlist or select an existing one to start adding tracks
                </p>
            </motion.div>
        );
    }

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleTrackClick = (track: Track) => {
        if (currentTrack?.id === track.id) {
            dispatch(setIsPlaying(!isPlaying));
        } else {
            dispatch(setCurrentTrack(track));
            dispatch(setIsPlaying(true));
        }
    };

    const handleTrackSelect = (trackId: string) => {
        const newSelected = new Set(selectedTracks);
        if (newSelected.has(trackId)) {
            newSelected.delete(trackId);
        } else {
            newSelected.add(trackId);
        }
        setSelectedTracks(newSelected);
    };

    const handleRemoveTrack = (trackId: string) => {
        dispatch(removeTrack(trackId));
        setShowOptions(null);
    };

    const handleTrackLike = (trackId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(toggleLikedTrack(trackId));
        onTrackLike?.(trackId);
        toast.success(likedTracks.includes(trackId) ? 'Removed from liked tracks' : 'Added to liked tracks');
    };

    const handleTrackDownload = (track: Track, e: React.MouseEvent) => {
        e.stopPropagation();
        dispatch(incrementDownloadCount());
        onTrackDownload?.();

        // Create a temporary link to download the audio
        const link = document.createElement('a');
        link.href = track.url;
        link.download = `${track.title}.mp3`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Download started!');
    };

    const handleRemoveSelected = () => {
        selectedTracks.forEach(trackId => {
            dispatch(removeTrack(trackId));
        });
        setSelectedTracks(new Set());
        toast.success(`Removed ${selectedTracks.size} tracks`);
    };

    const isTrackPlaying = (track: Track) => {
        return currentTrack?.id === track.id && isPlaying;
    };

    const isTrackLiked = (trackId: string) => {
        return likedTracks.includes(trackId);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-white/20 dark:border-white/10 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gradient">{currentPlaylist.name}</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {currentPlaylist.tracks.length} tracks • {formatDuration(currentPlaylist.tracks.reduce((total: number, track: Track) => total + track.duration, 0))}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {/* View Mode Toggle */}
                    <div className="flex bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'list' ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'grid' ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Remove Selected Button */}
                    {selectedTracks.size > 0 && (
                        <motion.button
                            onClick={handleRemoveSelected}
                            className="flex items-center space-x-2 px-3 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Remove ({selectedTracks.size})</span>
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Playlist Content */}
            <div className="flex-1 overflow-hidden">
                {currentPlaylist.tracks.length === 0 ? (
                    <motion.div
                        className="flex flex-col items-center justify-center py-12 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Empty Playlist</h3>
                        <p className="text-muted-foreground max-w-md">
                            Add some tracks to your playlist to get started
                        </p>
                    </motion.div>
                ) : viewMode === 'list' ? (
                    /* List View */
                    <div className="h-full overflow-y-auto custom-scrollbar">
                        <Reorder.Group
                            axis="y"
                            values={currentPlaylist.tracks}
                            onReorder={() => { }}
                            className="space-y-1 p-2"
                        >
                            {currentPlaylist.tracks.map((track: Track, index: number) => (
                                <Reorder.Item
                                    key={track.id}
                                    value={track}
                                    className="relative"
                                >
                                    <motion.div
                                        className={cn(
                                            "group flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg transition-all duration-200 cursor-pointer",
                                            "hover:bg-muted/50",
                                            currentTrack?.id === track.id && "bg-primary/10 border border-primary/20",
                                            selectedTracks.has(track.id) && "bg-primary/5 border border-primary/10"
                                        )}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => handleTrackClick(track)}
                                    >
                                        {/* Selection Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedTracks.has(track.id)}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                handleTrackSelect(track.id);
                                            }}
                                            className="w-4 h-4 text-primary border-gray-200 dark:border-gray-700 rounded focus:ring-blue-500"
                                        />

                                        {/* Track Number */}
                                        <div className="w-6 sm:w-8 text-center text-xs sm:text-sm text-muted-foreground">
                                            {index + 1}
                                        </div>

                                        {/* Thumbnail */}
                                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                            {track.thumbnail ? (
                                                <Image
                                                    src={track.thumbnail}
                                                    alt={track.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                                    <Music className="h-6 w-6 text-primary" />
                                                </div>
                                            )}

                                            {/* Play/Pause Overlay */}
                                            {isTrackPlaying(track) && (
                                                <motion.div
                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                >
                                                    <Pause className="h-5 w-5 text-white" />
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Track Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-foreground truncate text-sm sm:text-base">
                                                {track.title}
                                            </h4>
                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                {track.artist || "Unknown Artist"}
                                            </p>
                                        </div>

                                        {/* Duration */}
                                        <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{formatDuration(track.duration)}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Like Button */}
                                            <button
                                                onClick={(e) => handleTrackLike(track.id, e)}
                                                className={cn(
                                                    "p-2 rounded-md transition-colors",
                                                    isTrackLiked(track.id)
                                                        ? "text-red-500 hover:bg-red-500/10"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                )}
                                            >
                                                <Heart className={cn("h-4 w-4", isTrackLiked(track.id) && "fill-current")} />
                                            </button>

                                            {/* Download Button */}
                                            <button
                                                onClick={(e) => handleTrackDownload(track, e)}
                                                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>

                                            {/* More Options Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.innerWidth < 640) {
                                                        setShowMobileMenu(track.id);
                                                    } else {
                                                        setShowOptions(showOptions === track.id ? null : track.id);
                                                    }
                                                }}
                                                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Options Menu */}
                                        <AnimatePresence>
                                            {showOptions === track.id && (
                                                <motion.div
                                                    className="absolute right-0 top-full mt-1 w-48 glass-effect rounded-lg shadow-lg z-[100] border border-white/10"
                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                    ref={menuRef}
                                                    style={{
                                                        transformOrigin: 'top right',
                                                        maxHeight: '200px',
                                                        overflowY: 'auto'
                                                    }}
                                                >
                                                    <div className="p-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTrackClick(track);
                                                            }}
                                                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors"
                                                        >
                                                            {isTrackPlaying(track) ? (
                                                                <Pause className="h-4 w-4" />
                                                            ) : (
                                                                <Play className="h-4 w-4" />
                                                            )}
                                                            <span>{isTrackPlaying(track) ? 'Pause' : 'Play'}</span>
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTrackLike(track.id, e);
                                                            }}
                                                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors"
                                                        >
                                                            <Heart className="h-4 w-4" />
                                                            <span>{isTrackLiked(track.id) ? 'Liked' : 'Like'}</span>
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleTrackDownload(track, e);
                                                            }}
                                                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            <span>Download</span>
                                                        </button>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Handle share functionality
                                                                toast.success("Share functionality coming soon!");
                                                            }}
                                                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-white/10 transition-colors"
                                                        >
                                                            <Share2 className="h-4 w-4" />
                                                            <span>Share</span>
                                                        </button>

                                                        <div className="border-t border-white/20 dark:border-white/10 my-1" />

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveTrack(track.id);
                                                            }}
                                                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span>Remove</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                ) : (
                    /* Grid View */
                    <div className="h-full overflow-y-auto custom-scrollbar p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {currentPlaylist.tracks.map((track: Track) => (
                                <motion.div
                                    key={track.id}
                                    className="group relative bg-muted/30 rounded-lg overflow-hidden cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleTrackClick(track)}
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-square">
                                        {track.thumbnail ? (
                                            <Image
                                                src={track.thumbnail}
                                                alt={track.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                                <Music className="h-12 w-12 text-primary" />
                                            </div>
                                        )}

                                        {/* Play/Pause Overlay */}
                                        {isTrackPlaying(track) && (
                                            <motion.div
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                            >
                                                <Pause className="h-8 w-8 text-white" />
                                            </motion.div>
                                        )}

                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                            <button
                                                onClick={(e) => handleTrackLike(track.id, e)}
                                                className={cn(
                                                    "p-2 rounded-full transition-colors",
                                                    isTrackLiked(track.id)
                                                        ? "bg-red-500 text-white"
                                                        : "bg-white/20 text-white hover:bg-white/30"
                                                )}
                                            >
                                                <Heart className={cn("h-4 w-4", isTrackLiked(track.id) && "fill-current")} />
                                            </button>

                                            <button
                                                onClick={(e) => handleTrackDownload(track, e)}
                                                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Track Info */}
                                    <div className="p-3">
                                        <h4 className="font-medium text-foreground text-sm truncate">
                                            {track.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {track.artist || "Unknown Artist"}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Context Menu */}
            <AnimatePresence>
                {showMobileMenu && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-[200] flex items-end"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowMobileMenu(null)}
                    >
                        <motion.div
                            className="w-full bg-white/10 backdrop-blur-lg rounded-t-lg p-4"
                            initial={{ y: 300 }}
                            animate={{ y: 0 }}
                            exit={{ y: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Track Options</h3>
                                <button
                                    onClick={() => setShowMobileMenu(null)}
                                    className="p-2 rounded-full bg-white/10"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {showMobileMenu && currentPlaylist.tracks.find((t: Track) => t.id === showMobileMenu) && (
                                <div className="space-y-2">
                                    {(() => {
                                        const track = currentPlaylist.tracks.find((t: Track) => t.id === showMobileMenu)!;
                                        return (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        handleTrackClick(track);
                                                        setShowMobileMenu(null);
                                                    }}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                                >
                                                    {isTrackPlaying(track) ? (
                                                        <Pause className="h-5 w-5" />
                                                    ) : (
                                                        <Play className="h-5 w-5" />
                                                    )}
                                                    <span>{isTrackPlaying(track) ? 'Pause' : 'Play'}</span>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        handleTrackLike(track.id, e);
                                                        setShowMobileMenu(null);
                                                    }}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                                >
                                                    <Heart className={cn("h-5 w-5", isTrackLiked(track.id) && "fill-current text-red-500")} />
                                                    <span>{isTrackLiked(track.id) ? 'Liked' : 'Like'}</span>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        handleTrackDownload(track, e);
                                                        setShowMobileMenu(null);
                                                    }}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                                >
                                                    <Download className="h-5 w-5" />
                                                    <span>Download</span>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        handleRemoveTrack(track.id);
                                                        setShowMobileMenu(null);
                                                    }}
                                                    className="w-full flex items-center space-x-3 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors text-red-500"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                    <span>Remove</span>
                                                </button>
                                            </>
                                        );
                                    })()}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
