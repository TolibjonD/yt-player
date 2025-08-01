import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

            isPlayerVisible: false,
            isPlaylistVisible: false,
            isLoading: false,
            error: null,

            // Track actions
            setCurrentTrack: (track) => {
                set({ currentTrack: track, currentTime: 0 });
                if (track) {
                    set({ isPlayerVisible: true });
                }
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
            partialize: (state) => ({
                volume: state.volume,
                isMuted: state.isMuted,
                isShuffled: state.isShuffled,
                repeatMode: state.repeatMode,
                playlists: state.playlists,
                currentPlaylist: state.currentPlaylist,
            }),
        }
    )
);

export default usePlayerStore;