"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Youtube,
    Loader2,
    AlertCircle,
    CheckCircle,
    Plus,
    Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { addTrack, setCurrentTrackAndPlay, createPlaylist, setError, clearError } from "@/store/playerSlice";
import { cn } from "@/lib/utils";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

export default function UrlInput() {
    const [url, setUrl] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isValid, setIsValid] = useState<boolean | null>(null);

    // Use store selectors
    // Redux selectors and dispatch
    const dispatch = useAppDispatch();
    const currentPlaylist = useAppSelector((state) => state.player.currentPlaylist);
    const playlists = useAppSelector((state) => state.player.playlists);



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
            toast.error(ERROR_MESSAGES.EMPTY_URL);
            return;
        }

        if (!validateYouTubeUrl(url)) {
            toast.error(ERROR_MESSAGES.INVALID_URL);
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            toast.error(ERROR_MESSAGES.VIDEO_ID_EXTRACTION_FAILED);
            return;
        }

        setIsLoading(true);
        dispatch(setError(null));

        try {
            const response = await fetch(`/api/youtube?videoId=${videoId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                // Handle rate limiting
                if (response.status === HTTP_STATUS.RATE_LIMITED) {
                    throw new Error(data.error || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
                }

                // Handle video not found
                if (response.status === HTTP_STATUS.NOT_FOUND) {
                    throw new Error(data.error || ERROR_MESSAGES.VIDEO_NOT_FOUND);
                }

                // Handle forbidden (private/age-restricted)
                if (response.status === HTTP_STATUS.FORBIDDEN) {
                    throw new Error(data.error || ERROR_MESSAGES.VIDEO_PRIVATE);
                }

                // Handle bad request
                if (response.status === HTTP_STATUS.BAD_REQUEST) {
                    throw new Error(data.error || ERROR_MESSAGES.VIDEO_NO_AUDIO);
                }

                // Handle other errors
                throw new Error(data.error || data.suggestion || ERROR_MESSAGES.PROCESSING_FAILED);
            }

            const track = {
                id: videoId,
                title: data.data.title,
                artist: data.data.artist || "Unknown Artist",
                duration: data.data.duration || 0,
                url: data.data.url,
                thumbnail: data.data.thumbnail,
                youtubeUrl: url,
                addedAt: new Date().toISOString(),
            };

            // If no current playlist, create one
            if (!currentPlaylist) {
                const newPlaylistName = `Playlist ${playlists.length + 1}`;
                dispatch(createPlaylist(newPlaylistName));
                toast.success(`Created new playlist: ${newPlaylistName}`);
            }

            // Add track to current playlist
            dispatch(addTrack(track));

            // Set as current track and start playing
            dispatch(setCurrentTrackAndPlay(track));

            toast.success(`Added "${track.title}" to playlist and started playing`);
            setUrl("");
            setIsValid(null);

        } catch (error) {
            console.error("Error processing video:", error);
            let errorMessage: string = ERROR_MESSAGES.PROCESSING_FAILED;

            if (error instanceof Error) {
                // Handle specific error types
                if (error.message.includes("Rate limit exceeded")) {
                    errorMessage = error.message;
                } else if (error.message.includes("YouTube is currently blocking")) {
                    errorMessage = ERROR_MESSAGES.YOUTUBE_BLOCKING;
                } else if (error.message.includes("video unavailable")) {
                    errorMessage = ERROR_MESSAGES.VIDEO_NOT_FOUND;
                } else if (error.message.includes("private video")) {
                    errorMessage = ERROR_MESSAGES.VIDEO_PRIVATE;
                } else if (error.message.includes("age-restricted")) {
                    errorMessage = ERROR_MESSAGES.VIDEO_PRIVATE;
                } else if (error.message.includes("no audio format available")) {
                    errorMessage = ERROR_MESSAGES.NO_AUDIO_FORMAT;
                } else {
                    errorMessage = error.message;
                }
            }

            dispatch(setError(errorMessage));
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

                <motion.button
                    type="submit"
                    disabled={isLoading || !isValid}
                    className={cn(
                        "w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2",
                        isValid && !isLoading
                            ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600 transform hover:scale-105"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                    whileHover={isValid && !isLoading ? { scale: 1.02 } : {}}
                    whileTap={isValid && !isLoading ? { scale: 0.98 } : {}}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Plus className="h-5 w-5" />
                            <span>Add to Playlist</span>
                        </>
                    )}
                </motion.button>
            </form>

            {/* Features */}
            <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    <span>High Quality Audio</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <span>Instant Conversion</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span>Smart Playlists</span>
                </div>
            </div>
        </motion.div>
    );
}