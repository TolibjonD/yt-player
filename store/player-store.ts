import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

export interface Track {
    id: string;
    title: string;
    artist?: string;
    duration: number;
    url: string;
    thumbnail?: string;
    youtubeUrl: string;
    addedAt: Date;
}

export interface Playlist {
    id: string;
    name: string;
    tracks: Track[];
    createdAt: Date;
    updatedAt: Date;
}

interface PlayerState {
    // Current track
    currentTrack: Track | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isShuffled: boolean;
    repeatMode: 'none' | 'one' | 'all';

    // Playlist
    currentPlaylist: Playlist | null;
    playlists: Playlist[];

    // Stats
    likedTracks: string[];
    downloadCount: number;

    // UI state
    isPlayerVisible: boolean;
    isPlaylistVisible: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setCurrentTrack: (track: Track | null) => void;
    setIsPlaying: (playing: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    setIsMuted: (muted: boolean) => void;
    setIsShuffled: (shuffled: boolean) => void;
    setRepeatMode: (mode: 'none' | 'one' | 'all') => void;

    // Playlist actions
    addTrack: (track: Track) => void;
    removeTrack: (trackId: string) => void;
    playTrack: (trackId: string) => void;
    playNext: () => void;
    playPrevious: () => void;

    // Playlist management
    createPlaylist: (name: string) => void;
    deletePlaylist: (playlistId: string) => void;
    addTrackToPlaylist: (playlistId: string, track: Track) => void;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
    setCurrentPlaylist: (playlist: Playlist | null) => void;

    // Stats actions
    toggleLikedTrack: (trackId: string) => void;
    incrementDownloadCount: () => void;

    // UI actions
    setIsPlayerVisible: (visible: boolean) => void;
    setIsPlaylistVisible: (visible: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Utility actions
    clearError: () => void;
    resetPlayer: () => void;
}

const usePlayerStore = create<PlayerState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                // Initial state
                currentTrack: null,
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                volume: 1,
                isMuted: false,
                isShuffled: false,
                repeatMode: 'none',

                currentPlaylist: null,
                playlists: [],

                likedTracks: [],
                downloadCount: 0,

                isPlayerVisible: false,
                isPlaylistVisible: false,
                isLoading: false,
                error: null,

                // Track actions
                setCurrentTrack: (track) => {
                    set((state) => ({
                        currentTrack: track,
                        currentTime: 0,
                        isPlayerVisible: track ? true : state.isPlayerVisible,
                    }));
                },

                setIsPlaying: (playing) => set({ isPlaying: playing }),

                setCurrentTime: (time) => set({ currentTime: time }),

                setDuration: (duration) => set({ duration }),

                setVolume: (volume) => set({ volume }),

                setIsMuted: (muted) => set({ isMuted: muted }),

                setIsShuffled: (shuffled) => set({ isShuffled: shuffled }),

                setRepeatMode: (mode) => set({ repeatMode: mode }),

                // Playlist actions
                addTrack: (track) => {
                    const { currentPlaylist } = get();
                    if (currentPlaylist) {
                        const updatedPlaylist = {
                            ...currentPlaylist,
                            tracks: [...currentPlaylist.tracks, track],
                            updatedAt: new Date(),
                        };

                        set((state) => ({
                            currentPlaylist: updatedPlaylist,
                            playlists: state.playlists.map((p) =>
                                p.id === currentPlaylist.id ? updatedPlaylist : p
                            ),
                        }));
                    }
                },

                removeTrack: (trackId) => {
                    const { currentPlaylist } = get();
                    if (currentPlaylist) {
                        const updatedPlaylist = {
                            ...currentPlaylist,
                            tracks: currentPlaylist.tracks.filter((t) => t.id !== trackId),
                            updatedAt: new Date(),
                        };

                        set((state) => ({
                            currentPlaylist: updatedPlaylist,
                            playlists: state.playlists.map((p) =>
                                p.id === currentPlaylist.id ? updatedPlaylist : p
                            ),
                        }));
                    }
                },

                playTrack: (trackId) => {
                    const { currentPlaylist } = get();
                    if (currentPlaylist) {
                        const track = currentPlaylist.tracks.find((t) => t.id === trackId);
                        if (track) {
                            set({ currentTrack: track, isPlaying: true, currentTime: 0 });
                        }
                    }
                },

                playNext: () => {
                    const { currentTrack, currentPlaylist, repeatMode } = get();
                    if (!currentPlaylist || !currentTrack) return;

                    const currentIndex = currentPlaylist.tracks.findIndex(
                        (t) => t.id === currentTrack.id
                    );

                    if (currentIndex === -1) return;

                    let nextIndex: number;

                    if (repeatMode === 'one') {
                        nextIndex = currentIndex;
                    } else if (currentIndex === currentPlaylist.tracks.length - 1) {
                        if (repeatMode === 'all') {
                            nextIndex = 0;
                        } else {
                            return; // End of playlist
                        }
                    } else {
                        nextIndex = currentIndex + 1;
                    }

                    const nextTrack = currentPlaylist.tracks[nextIndex];
                    set({ currentTrack: nextTrack, isPlaying: true, currentTime: 0 });
                },

                playPrevious: () => {
                    const { currentTrack, currentPlaylist } = get();
                    if (!currentPlaylist || !currentTrack) return;

                    const currentIndex = currentPlaylist.tracks.findIndex(
                        (t) => t.id === currentTrack.id
                    );

                    if (currentIndex <= 0) return;

                    const prevTrack = currentPlaylist.tracks[currentIndex - 1];
                    set({ currentTrack: prevTrack, isPlaying: true, currentTime: 0 });
                },

                // Playlist management
                createPlaylist: (name) => {
                    const newPlaylist: Playlist = {
                        id: Date.now().toString(),
                        name,
                        tracks: [],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    set((state) => ({
                        playlists: [...state.playlists, newPlaylist],
                        currentPlaylist: newPlaylist,
                    }));
                },

                deletePlaylist: (playlistId) => {
                    set((state) => ({
                        playlists: state.playlists.filter((p) => p.id !== playlistId),
                        currentPlaylist: state.currentPlaylist?.id === playlistId ? null : state.currentPlaylist,
                    }));
                },

                addTrackToPlaylist: (playlistId, track) => {
                    set((state) => ({
                        playlists: state.playlists.map((p) =>
                            p.id === playlistId
                                ? {
                                    ...p,
                                    tracks: [...p.tracks, track],
                                    updatedAt: new Date(),
                                }
                                : p
                        ),
                    }));
                },

                removeTrackFromPlaylist: (playlistId, trackId) => {
                    set((state) => ({
                        playlists: state.playlists.map((p) =>
                            p.id === playlistId
                                ? {
                                    ...p,
                                    tracks: p.tracks.filter((t) => t.id !== trackId),
                                    updatedAt: new Date(),
                                }
                                : p
                        ),
                    }));
                },

                setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),

                // Stats actions
                toggleLikedTrack: (trackId) => {
                    set((state) => ({
                        likedTracks: state.likedTracks.includes(trackId)
                            ? state.likedTracks.filter(id => id !== trackId)
                            : [...state.likedTracks, trackId]
                    }));
                },

                incrementDownloadCount: () => {
                    set((state) => ({
                        downloadCount: state.downloadCount + 1
                    }));
                },

                // UI actions
                setIsPlayerVisible: (visible) => set({ isPlayerVisible: visible }),

                setIsPlaylistVisible: (visible) => set({ isPlaylistVisible: visible }),

                setIsLoading: (loading) => set({ isLoading: loading }),

                setError: (error) => set({ error }),

                // Utility actions
                clearError: () => set({ error: null }),

                resetPlayer: () => {
                    set({
                        currentTrack: null,
                        isPlaying: false,
                        currentTime: 0,
                        duration: 0,
                        isPlayerVisible: false,
                        error: null,
                    });
                },
            }),
            {
                name: 'yt-player-storage',
                // Only persist essential data to reduce storage size
                partialize: (state) => ({
                    volume: state.volume,
                    isMuted: state.isMuted,
                    isShuffled: state.isShuffled,
                    repeatMode: state.repeatMode,
                    playlists: state.playlists,
                    currentPlaylist: state.currentPlaylist,
                    likedTracks: state.likedTracks,
                    downloadCount: state.downloadCount,
                }),
                // Optimize storage with compression
                version: 1,
                migrate: (persistedState: any, version: number) => {
                    if (version === 0) {
                        // Handle migration from version 0 to 1
                        return {
                            ...persistedState,
                            // Add any new fields with defaults
                        };
                    }
                    return persistedState;
                },
            }
        )
    )
);

// Optimized selectors for better performance
export const useCurrentTrack = () => usePlayerStore((state) => state.currentTrack);
export const useIsPlaying = () => usePlayerStore((state) => state.isPlaying);
export const usePlayerControls = () => usePlayerStore((state) => ({
    currentTime: state.currentTime,
    duration: state.duration,
    volume: state.volume,
    isMuted: state.isMuted,
    isShuffled: state.isShuffled,
    repeatMode: state.repeatMode,
    isPlayerVisible: state.isPlayerVisible,
}));
export const usePlaylist = () => usePlayerStore((state) => ({
    currentPlaylist: state.currentPlaylist,
    playlists: state.playlists,
    likedTracks: state.likedTracks,
    downloadCount: state.downloadCount,
}));
export const usePlayerActions = () => usePlayerStore((state) => ({
    setCurrentTrack: state.setCurrentTrack,
    setIsPlaying: state.setIsPlaying,
    setCurrentTime: state.setCurrentTime,
    setDuration: state.setDuration,
    setVolume: state.setVolume,
    setIsMuted: state.setIsMuted,
    setIsShuffled: state.setIsShuffled,
    setRepeatMode: state.setRepeatMode,
    playNext: state.playNext,
    playPrevious: state.playPrevious,
    addTrack: state.addTrack,
    removeTrack: state.removeTrack,
    playTrack: state.playTrack,
    createPlaylist: state.createPlaylist,
    deletePlaylist: state.deletePlaylist,
    addTrackToPlaylist: state.addTrackToPlaylist,
    removeTrackFromPlaylist: state.removeTrackFromPlaylist,
    setCurrentPlaylist: state.setCurrentPlaylist,
    toggleLikedTrack: state.toggleLikedTrack,
    incrementDownloadCount: state.incrementDownloadCount,
    setIsPlayerVisible: state.setIsPlayerVisible,
    setIsPlaylistVisible: state.setIsPlaylistVisible,
    setIsLoading: state.setIsLoading,
    setError: state.setError,
    clearError: state.clearError,
    resetPlayer: state.resetPlayer,
}));

export default usePlayerStore;