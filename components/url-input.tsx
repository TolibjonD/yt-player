"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Youtube,
    Music,
    Loader2,
    AlertCircle,
    CheckCircle,
    Play,
    Plus,
    Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import usePlayerStore, { Track } from "@/store/player-store";
import { cn } from "@/lib/utils";

export default function UrlInput() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    const {
        currentPlaylist,
        addTrack,
        createPlaylist,
        setCurrentPlaylist,
        playlists,
        setError,
        clearError
    } = usePlayerStore();

    const validateYouTubeUrl = (url: string): boolean => {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
        ];
        return patterns.some(pattern => pattern.test(url));
    };

    const extractVideoId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
            /youtube\.com\/embed\/([\w-]+)/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUrl(value);
        clearError();

        if (value.trim()) {
            setIsValid(validateYouTubeUrl(value));
        } else {
            setIsValid(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim()) {
            toast.error("Please enter a YouTube URL");
            return;
        }

        if (!validateYouTubeUrl(url)) {
            toast.error("Please enter a valid YouTube URL");
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            toast.error("Could not extract video ID from URL");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/youtube?videoId=${videoId}`);

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Handle rate limiting
                if (response.status === 429) {
                    const retryAfter = data.retryAfter || 60;
                    throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
                }

                // Handle service unavailable (bot detection, etc.)
                if (response.status === 503) {
                    const retryAfter = data.retryAfter || 300;
                    const suggestion = data.suggestion || 'Please try again later.';
                    throw new Error(`${data.error} ${suggestion}`);
                }

                // Handle other errors
                throw new Error(data.error || data.suggestion || "Failed to process video");
            }

            const track: Track = {
                id: videoId,
                title: data.title,
                artist: data.author || "Unknown Artist",
                duration: data.duration || 0,
                url: data.audioUrl,
                thumbnail: data.thumbnail,
                youtubeUrl: url,
                addedAt: new Date(),
            };

            // If no current playlist, create one
            if (!currentPlaylist) {
                const newPlaylistName = `Playlist ${playlists.length + 1}`;
                createPlaylist(newPlaylistName);
                toast.success(`Created new playlist: ${newPlaylistName}`);
            }

            // Add track to current playlist
            addTrack(track);

            toast.success(`Added "${track.title}" to playlist`);
            setUrl("");
            setIsValid(null);

        } catch (error) {
            console.error("Error processing video:", error);
            let errorMessage = "Failed to process video";

            if (error instanceof Error) {
                // Handle specific error types
                if (error.message.includes("Rate limit exceeded")) {
                    errorMessage = error.message;
                } else if (error.message.includes("YouTube is currently blocking")) {
                    errorMessage = error.message;
                } else if (error.message.includes("video unavailable")) {
                    errorMessage = "This video is not available or has been removed.";
                } else if (error.message.includes("private video")) {
                    errorMessage = "This video is private and cannot be accessed.";
                } else if (error.message.includes("age-restricted")) {
                    errorMessage = "This video is age-restricted and cannot be processed.";
                } else if (error.message.includes("no audio format available")) {
                    errorMessage = "No audio format is available for this video.";
                } else {
                    errorMessage = error.message;
                }
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="glass-effect rounded-xl p-6 shining-effect"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="text-center mb-6">
                <motion.div
                    className="w-16 h-16 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <Youtube className="h-8 w-8 text-gradient" />
                </motion.div>
                <h2 className="text-xl font-bold mb-2 text-gradient">Add YouTube Track</h2>
                <p className="text-sm text-muted-foreground">
                    Paste a YouTube URL to convert it to MP3
                </p>
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <div className="relative">
                        <input
                            type="url"
                            value={url}
                            onChange={handleUrlChange}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className={cn(
                                "w-full px-4 py-3 bg-transparent border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2",
                                isValid === null
                                    ? "border-white/20 dark:border-white/10 focus:border-rose-500/50 focus:ring-rose-500/20"
                                    : isValid
                                        ? "border-green-500/50 focus:border-green-500/50 focus:ring-green-500/20"
                                        : "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                            )}
                            disabled={isLoading}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                            ) : isValid === null ? (
                                <Youtube className="h-5 w-5 text-muted-foreground" />
                            ) : isValid ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={isLoading || !isValid}
                    className={cn(
                        "w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2",
                        isLoading || !isValid
                            ? "bg-muted text-muted-foreground cursor-not-allowed"
                            : "btn-primary shining-effect"
                    )}
                    whileHover={!isLoading && isValid ? { scale: 1.02 } : {}}
                    whileTap={!isLoading && isValid ? { scale: 0.98 } : {}}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Converting...</span>
                        </>
                    ) : (
                        <>
                            <Play className="h-5 w-5" />
                            <span>Add to Playlist</span>
                        </>
                    )}
                </motion.button>
            </form>

            {/* Features */}
            <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                <h3 className="text-sm font-medium mb-3 text-gradient">Features</h3>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-rose-500" />
                        <span>High Quality MP3 Conversion</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-orange-500" />
                        <span>Instant Processing</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <span>Automatic Playlist Creation</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <div className="text-lg font-bold text-gradient">{playlists.length}</div>
                        <div className="text-xs text-muted-foreground">Playlists</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gradient">
                            {playlists.reduce((total, playlist) => total + playlist.tracks.length, 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Tracks</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}