"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
    Sun, Moon, Music, Plus, Settings, Menu, X, Play, Pause,
    SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1,
    ChevronDown, Check
} from "lucide-react";
import usePlayerStore from "@/store/player-store";
import { cn } from "@/lib/utils";

// Modern Dropdown Component
function PlaylistDropdown({
    playlists,
    currentPlaylist,
    onSelect
}: {
    playlists: any[],
    currentPlaylist: any,
    onSelect: (playlist: any) => void
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-transparent border border-white/20 dark:border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
                <span className="truncate">
                    {currentPlaylist ? currentPlaylist.name : "Select Playlist"}
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute top-full left-0 mt-1 w-48 glass-effect rounded-lg shadow-lg z-50"
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="p-1">
                            {playlists.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    No playlists available
                                </div>
                            ) : (
                                playlists.map((playlist) => (
                                    <button
                                        key={playlist.id}
                                        onClick={() => {
                                            onSelect(playlist);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                                            currentPlaylist?.id === playlist.id
                                                ? "bg-gradient-to-r from-rose-500/10 to-orange-500/10 text-gradient"
                                                : "hover:bg-white/10"
                                        )}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Music className="h-4 w-4" />
                                            <span className="truncate">{playlist.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-muted-foreground">
                                                {playlist.tracks.length}
                                            </span>
                                            {currentPlaylist?.id === playlist.id && (
                                                <Check className="h-4 w-4 text-gradient" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showNewPlaylistDialog, setShowNewPlaylistDialog] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        currentTrack,
        isPlaying,
        isShuffled,
        repeatMode,
        currentPlaylist,
        playlists,
        setIsPlaying,
        setIsShuffled,
        setRepeatMode,
        playNext,
        playPrevious,
        createPlaylist,
        setCurrentPlaylist,
        isPlayerVisible,
    } = usePlayerStore();

    const handleCreatePlaylist = () => {
        if (newPlaylistName.trim()) {
            createPlaylist(newPlaylistName.trim());
            setNewPlaylistName("");
            setShowNewPlaylistDialog(false);
        }
    };

    const toggleRepeatMode = () => {
        const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setRepeatMode(modes[nextIndex]);
    };

    return (
        <>
            <motion.header
                className="sticky top-0 z-50 w-full glass-effect border-b border-white/20 dark:border-white/10"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo and Title */}
                    <motion.div
                        className="flex items-center space-x-3"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <div className="relative">
                            <Music className="h-8 w-8 text-gradient" />
                            <motion.div
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500/20 to-orange-500/20"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gradient">YT Player</h1>
                            <p className="text-xs text-muted-foreground">Modern MP3 Player</p>
                        </div>
                    </motion.div>

                    {/* Desktop Controls */}
                    <div className="hidden md:flex items-center space-x-4">
                        {/* Playlist Selector */}
                        <PlaylistDropdown
                            playlists={playlists}
                            currentPlaylist={currentPlaylist}
                            onSelect={setCurrentPlaylist}
                        />

                        {/* Player Controls */}
                        {isPlayerVisible && currentTrack && (
                            <motion.div
                                className="flex items-center space-x-2"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <button
                                    onClick={playPrevious}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                >
                                    <SkipBack className="h-4 w-4" />
                                </button>

                                <motion.button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="p-2 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-lg transition-all duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-4 w-4" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                </motion.button>

                                <button
                                    onClick={playNext}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                                >
                                    <SkipForward className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={() => setIsShuffled(!isShuffled)}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isShuffled ? "text-gradient bg-gradient-to-r from-rose-500/10 to-orange-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                    )}
                                >
                                    <Shuffle className="h-4 w-4" />
                                </button>

                                <button
                                    onClick={toggleRepeatMode}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        repeatMode !== 'none' ? "text-gradient bg-gradient-to-r from-rose-500/10 to-orange-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                                    )}
                                >
                                    {repeatMode === 'one' ? (
                                        <Repeat1 className="h-4 w-4" />
                                    ) : (
                                        <Repeat className="h-4 w-4" />
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                            <motion.button
                                onClick={() => setShowNewPlaylistDialog(true)}
                                className="btn-secondary px-3 py-1.5 text-sm flex items-center space-x-1 shining-effect"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="h-4 w-4" />
                                <span>New Playlist</span>
                            </motion.button>

                            {mounted && (
                                <motion.button
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="p-2 rounded-lg glass-effect text-foreground hover:bg-white/10 transition-all duration-300"
                                    whileHover={{ scale: 1.1, rotate: 180 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {theme === "dark" ? (
                                        <Sun className="h-4 w-4" />
                                    ) : (
                                        <Moon className="h-4 w-4" />
                                    )}
                                </motion.button>
                            )}

                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-white/10"
                            >
                                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-white/10"
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            className="md:hidden border-t border-white/20 dark:border-white/10 bg-background/95 backdrop-blur"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="p-4 space-y-4">
                                {/* Playlist Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Select Playlist
                                    </label>
                                    <PlaylistDropdown
                                        playlists={playlists}
                                        currentPlaylist={currentPlaylist}
                                        onSelect={setCurrentPlaylist}
                                    />
                                </div>

                                {/* Player Controls */}
                                {isPlayerVisible && currentTrack && (
                                    <div className="flex items-center justify-center space-x-2">
                                        <button
                                            onClick={playPrevious}
                                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-white/10"
                                        >
                                            <SkipBack className="h-5 w-5" />
                                        </button>

                                        <motion.button
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="p-3 rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-lg transition-all duration-300"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {isPlaying ? (
                                                <Pause className="h-5 w-5" />
                                            ) : (
                                                <Play className="h-5 w-5" />
                                            )}
                                        </motion.button>

                                        <button
                                            onClick={playNext}
                                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-white/10"
                                        >
                                            <SkipForward className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-center space-x-2">
                                    <motion.button
                                        onClick={() => setShowNewPlaylistDialog(true)}
                                        className="btn-secondary px-4 py-2 text-sm flex items-center space-x-2"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>New Playlist</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* New Playlist Dialog */}
            <AnimatePresence>
                {showNewPlaylistDialog && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowNewPlaylistDialog(false)}
                        />
                        <motion.div
                            className="relative glass-effect rounded-lg p-6 w-full max-w-md"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <h3 className="text-lg font-semibold mb-4 text-gradient">Create New Playlist</h3>
                            <input
                                type="text"
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                placeholder="Enter playlist name..."
                                className="w-full px-3 py-2 bg-transparent border border-white/20 dark:border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                                onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                            />
                            <div className="flex items-center justify-end space-x-2 mt-4">
                                <button
                                    onClick={() => setShowNewPlaylistDialog(false)}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    onClick={handleCreatePlaylist}
                                    className="btn-primary px-4 py-2 text-sm"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Create
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}