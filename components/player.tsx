'use client';

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Shuffle,
    Repeat,
    Repeat1
} from 'lucide-react';
import {
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setIsMuted,
    setIsShuffled,
    setRepeatMode,
    playNext,
    playPrevious,
    setCurrentTrackAndPlay
} from '@/store/playerSlice';

export function Player() {
    const dispatch = useAppDispatch();
    const {
        isPlaying,
        volume,
        isMuted,
        currentTrack,
        currentTime,
        duration,
        isShuffled,
        repeatMode
    } = useAppSelector((state) => state.player);

    const audioRef = useRef<HTMLAudioElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

    // Create stable error handler
    const handleAudioError = useCallback((e: Event) => {
        console.error('Audio loading error:', e);
        dispatch(setIsPlaying(false));
    }, [dispatch]);

    // Audio event handlers
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            if (!isDragging) {
                dispatch(setCurrentTime(audio.currentTime));
            }
        };

        const handleLoadedMetadata = () => {
            dispatch(setDuration(audio.duration));
        };

        const handleEnded = () => {
            dispatch(setIsPlaying(false));
            // Auto-play next track if available
            if (repeatMode === 'all') {
                dispatch(playNext());
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [dispatch, repeatMode, isDragging]);

    // Sync audio with state
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        // Only handle play/pause if the track is already loaded
        if (currentTrackId === currentTrack.id) {
            if (isPlaying) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch((error) => {
                        console.error('Error playing audio:', error);
                        dispatch(setIsPlaying(false));
                    });
                }
            } else {
                audio.pause();
            }
        }
    }, [isPlaying, currentTrack, currentTrackId, dispatch]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || !currentTrack) return;

        // Only reload if the track has actually changed
        if (currentTrackId !== currentTrack.id) {
            setCurrentTrackId(currentTrack.id);

            // Use a more robust approach to prevent DOMException
            const loadNewTrack = async () => {
                try {
                    setIsLoading(true);

                    // Pause and reset current audio
                    audio.pause();

                    // Clear current source
                    audio.removeAttribute('src');
                    audio.load();

                    // Set new source
                    audio.src = currentTrack.url;

                    // Load the new audio
                    await audio.load();

                    // If we should be playing, start playback
                    if (isPlaying) {
                        await audio.play();
                    }
                } catch (error) {
                    console.error('Error loading audio track:', error);
                    dispatch(setIsPlaying(false));
                } finally {
                    setIsLoading(false);
                }
            };

            loadNewTrack();
        } else if (currentTrackId === currentTrack.id && isPlaying) {
            // If it's the same track and we should be playing, just play it
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.error('Error playing audio:', error);
                    dispatch(setIsPlaying(false));
                });
            }
        }

        // Add error handling
        audio.addEventListener('error', handleAudioError);

        return () => {
            audio.removeEventListener('error', handleAudioError);
        };
    }, [currentTrack, handleAudioError, isPlaying, currentTrackId, dispatch]);

    // Control handlers
    const togglePlay = () => {
        if (isLoading) return; // Prevent action while loading

        if (currentTrackId === currentTrack?.id) {
            // Same track, just toggle play/pause
            dispatch(setIsPlaying(!isPlaying));
        } else {
            // Different track, set as current and play
            if (currentTrack) {
                dispatch(setCurrentTrackAndPlay(currentTrack));
            }
        }
    };

    const toggleMute = () => {
        dispatch(setIsMuted(!isMuted));
    };

    const toggleShuffle = () => {
        dispatch(setIsShuffled(!isShuffled));
    };

    const cycleRepeatMode = () => {
        const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(repeatMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        dispatch(setRepeatMode(modes[nextIndex]));
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const newTime = parseFloat(e.target.value);
        audio.currentTime = newTime;
        dispatch(setCurrentTime(newTime));
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        dispatch(setVolume(newVolume));
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (!currentTrack) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 p-4 z-50">
            <audio ref={audioRef} preload="metadata" />

            <div className="max-w-7xl mx-auto flex items-center gap-4">
                {/* Track Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {currentTrack.thumbnail && (
                        <Image
                            src={currentTrack.thumbnail}
                            alt={currentTrack.title}
                            width={48}
                            height={48}
                            className="rounded-md object-cover"
                        />
                    )}
                    <div className="min-w-0 flex-1">
                        <h3 className="text-white font-medium truncate">{currentTrack.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{currentTrack.artist}</p>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleShuffle}
                        className={`p-2 rounded-full transition-colors ${isShuffled ? 'text-green-500' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Shuffle size={20} />
                    </button>

                    <button
                        onClick={() => dispatch(playPrevious())}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <SkipBack size={24} />
                    </button>

                    <button
                        onClick={togglePlay}
                        className="p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                            <Pause size={24} />
                        ) : (
                            <Play size={24} />
                        )}
                    </button>

                    <button
                        onClick={() => dispatch(playNext())}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <SkipForward size={24} />
                    </button>

                    <button
                        onClick={cycleRepeatMode}
                        className={`p-2 rounded-full transition-colors ${repeatMode === 'none' ? 'text-gray-400 hover:text-white' :
                            repeatMode === 'one' ? 'text-green-500' : 'text-blue-500'
                            }`}
                    >
                        {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <span className="text-gray-400 text-sm w-12 text-right">
                        {formatTime(currentTime)}
                    </span>
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-gray-400 text-sm w-12">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3 relative group">
                    <button
                        onClick={toggleMute}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    {/* Volume Slider - Always visible but compact */}
                    <div className="w-24 h-8 flex items-center relative">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer slider hover:bg-gray-500 transition-colors"
                            style={{
                                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(isMuted ? 0 : volume) * 100}%, #4B5563 ${(isMuted ? 0 : volume) * 100}%, #4B5563 100%)`
                            }}
                        />

                        {/* Volume percentage tooltip */}
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {Math.round((isMuted ? 0 : volume) * 100)}%
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .slider:focus {
          outline: none;
        }
        
        .slider:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        
        .slider:focus::-moz-range-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
      `}</style>
        </div>
    );
}