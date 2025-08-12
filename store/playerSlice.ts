import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number;
    url: string;
    thumbnail?: string;
    youtubeUrl: string;
    addedAt: string; // Store as ISO string instead of Date
}

export interface Playlist {
    id: string;
    name: string;
    tracks: Track[];
    createdAt: string; // Store as ISO string instead of Date
    updatedAt: string; // Store as ISO string instead of Date
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
}

const initialState: PlayerState = {
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
};

const playerSlice = createSlice({
    name: 'player',
    initialState,
    reducers: {
        setCurrentTrack: (state, action: PayloadAction<Track | null>) => {
            state.currentTrack = action.payload;
            state.currentTime = 0;
            if (action.payload) {
                state.isPlayerVisible = true;
            }
        },
        setCurrentTrackAndPlay: (state, action: PayloadAction<Track | null>) => {
            state.currentTrack = action.payload;
            state.currentTime = 0;
            state.isPlaying = action.payload ? true : false;
            if (action.payload) {
                state.isPlayerVisible = true;
            }
        },
        setIsPlaying: (state, action: PayloadAction<boolean>) => {
            state.isPlaying = action.payload;
        },
        setCurrentTime: (state, action: PayloadAction<number>) => {
            state.currentTime = action.payload;
        },
        setDuration: (state, action: PayloadAction<number>) => {
            state.duration = action.payload;
        },
        setVolume: (state, action: PayloadAction<number>) => {
            state.volume = action.payload;
        },
        setIsMuted: (state, action: PayloadAction<boolean>) => {
            state.isMuted = action.payload;
        },
        setIsShuffled: (state, action: PayloadAction<boolean>) => {
            state.isShuffled = action.payload;
        },
        setRepeatMode: (state, action: PayloadAction<'none' | 'one' | 'all'>) => {
            state.repeatMode = action.payload;
        },
        addTrack: (state, action: PayloadAction<Track>) => {
            const track = action.payload;
            if (state.currentPlaylist) {
                const playlistIndex = state.playlists.findIndex(p => p.id === state.currentPlaylist!.id);
                if (playlistIndex !== -1) {
                    state.playlists[playlistIndex].tracks.push(track);
                    state.playlists[playlistIndex].updatedAt = new Date().toISOString();
                    state.currentPlaylist = state.playlists[playlistIndex];
                }
                if (!state.currentTrack) {
                    state.currentTrack = track;
                    state.isPlaying = true;
                }
                state.isPlayerVisible = true;
            }
        },
        removeTrack: (state, action: PayloadAction<string>) => {
            const trackId = action.payload;
            if (state.currentPlaylist) {
                const playlistIndex = state.playlists.findIndex(p => p.id === state.currentPlaylist!.id);
                if (playlistIndex !== -1) {
                    state.playlists[playlistIndex].tracks = state.playlists[playlistIndex].tracks.filter(t => t.id !== trackId);
                    state.playlists[playlistIndex].updatedAt = new Date().toISOString();
                    state.currentPlaylist = state.playlists[playlistIndex];
                }
            }
        },
        playTrack: (state, action: PayloadAction<string>) => {
            const trackId = action.payload;
            if (state.currentPlaylist) {
                const track = state.currentPlaylist.tracks.find(t => t.id === trackId);
                if (track) {
                    state.currentTrack = track;
                    state.isPlaying = true;
                    state.currentTime = 0;
                }
            }
        },
        playNext: (state) => {
            if (!state.currentPlaylist || !state.currentTrack) return;

            const currentIndex = state.currentPlaylist.tracks.findIndex(t => t.id === state.currentTrack!.id);
            if (currentIndex === -1) return;

            let nextIndex: number;
            if (state.repeatMode === 'one') {
                nextIndex = currentIndex;
            } else if (currentIndex === state.currentPlaylist.tracks.length - 1) {
                if (state.repeatMode === 'all') {
                    nextIndex = 0;
                } else {
                    return;
                }
            } else {
                nextIndex = currentIndex + 1;
            }

            const nextTrack = state.currentPlaylist.tracks[nextIndex];
            state.currentTrack = nextTrack;
            state.isPlaying = true;
            state.currentTime = 0;
        },
        playPrevious: (state) => {
            if (!state.currentPlaylist || !state.currentTrack) return;

            const currentIndex = state.currentPlaylist.tracks.findIndex(t => t.id === state.currentTrack!.id);
            if (currentIndex <= 0) return;

            const prevTrack = state.currentPlaylist.tracks[currentIndex - 1];
            state.currentTrack = prevTrack;
            state.isPlaying = true;
            state.currentTime = 0;
        },
        createPlaylist: (state, action: PayloadAction<string>) => {
            const name = action.payload;
            const newPlaylist: Playlist = {
                id: Date.now().toString(),
                name,
                tracks: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            state.playlists.push(newPlaylist);
            state.currentPlaylist = newPlaylist;
        },
        deletePlaylist: (state, action: PayloadAction<string>) => {
            const playlistId = action.payload;
            state.playlists = state.playlists.filter(p => p.id !== playlistId);
            if (state.currentPlaylist?.id === playlistId) {
                state.currentPlaylist = null;
            }
        },
        addTrackToPlaylist: (state, action: PayloadAction<{ playlistId: string; track: Track }>) => {
            const { playlistId, track } = action.payload;
            const playlistIndex = state.playlists.findIndex(p => p.id === playlistId);
            if (playlistIndex !== -1) {
                state.playlists[playlistIndex].tracks.push(track);
                state.playlists[playlistIndex].updatedAt = new Date().toISOString();
            }
        },
        removeTrackFromPlaylist: (state, action: PayloadAction<{ playlistId: string; trackId: string }>) => {
            const { playlistId, trackId } = action.payload;
            const playlistIndex = state.playlists.findIndex(p => p.id === playlistId);
            if (playlistIndex !== -1) {
                state.playlists[playlistIndex].tracks = state.playlists[playlistIndex].tracks.filter(t => t.id !== trackId);
                state.playlists[playlistIndex].updatedAt = new Date().toISOString();
            }
        },
        setCurrentPlaylist: (state, action: PayloadAction<Playlist | null>) => {
            state.currentPlaylist = action.payload;
        },
        toggleLikedTrack: (state, action: PayloadAction<string>) => {
            const trackId = action.payload;
            if (state.likedTracks.includes(trackId)) {
                state.likedTracks = state.likedTracks.filter(id => id !== trackId);
            } else {
                state.likedTracks.push(trackId);
            }
        },
        incrementDownloadCount: (state) => {
            state.downloadCount += 1;
        },
        setIsPlayerVisible: (state, action: PayloadAction<boolean>) => {
            state.isPlayerVisible = action.payload;
        },
        setIsPlaylistVisible: (state, action: PayloadAction<boolean>) => {
            state.isPlaylistVisible = action.payload;
        },
        setIsLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        resetPlayer: (state) => {
            state.currentTrack = null;
            state.isPlaying = false;
            state.currentTime = 0;
            state.duration = 0;
            state.isPlayerVisible = false;
            state.error = null;
        },
    },
});

export const {
    setCurrentTrack,
    setCurrentTrackAndPlay,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setIsMuted,
    setIsShuffled,
    setRepeatMode,
    addTrack,
    removeTrack,
    playTrack,
    playNext,
    playPrevious,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    setCurrentPlaylist,
    toggleLikedTrack,
    incrementDownloadCount,
    setIsPlayerVisible,
    setIsPlaylistVisible,
    setIsLoading,
    setError,
    clearError,
    resetPlayer,
} = playerSlice.actions;

export default playerSlice.reducer;
