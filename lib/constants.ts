// Error messages
export const ERROR_MESSAGES = {
    // YouTube API errors
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please wait before trying again.',
    VIDEO_NOT_FOUND: 'Video not found or unavailable.',
    VIDEO_PRIVATE: 'This video is private, age-restricted, or cannot be accessed.',
    VIDEO_NO_AUDIO: 'Invalid video or no audio available.',
    YOUTUBE_BLOCKING: 'YouTube is currently blocking requests. Please try again later.',
    NO_AUDIO_FORMAT: 'No audio format is available for this video.',
    PROCESSING_FAILED: 'Failed to process video.',

    // User input errors
    INVALID_URL: 'Please enter a valid YouTube URL.',
    EMPTY_URL: 'Please enter a YouTube URL.',
    VIDEO_ID_EXTRACTION_FAILED: 'Could not extract video ID from URL.',

    // Generic errors
    UNKNOWN_ERROR: 'An unexpected error occurred.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    RATE_LIMITED: 429,
    INTERNAL_SERVER_ERROR: 500,
} as const;

// API response messages
export const API_MESSAGES = {
    SUCCESS: 'Video processed successfully.',
    RATE_LIMIT: 'Too many requests. Please wait before trying again.',
    VIDEO_UNAVAILABLE: 'This video is not available or has been removed.',
    PRIVATE_VIDEO: 'This video is private and cannot be accessed.',
    AGE_RESTRICTED: 'This video is age-restricted and cannot be processed.',
    NO_AUDIO: 'No audio format is available for this video.',
} as const;

// Player states
export const PLAYER_STATES = {
    LOADING: 'loading',
    PLAYING: 'playing',
    PAUSED: 'paused',
    ERROR: 'error',
    ENDED: 'ended',
} as const;

// Repeat modes
export const REPEAT_MODES = {
    NONE: 'none',
    ONE: 'one',
    ALL: 'all',
} as const;

// Default values
export const DEFAULTS = {
    VOLUME: 1,
    RETRY_DELAY: 60,
    MAX_REQUESTS: 20,
    REQUEST_WINDOW: 60000, // 1 minute
} as const;
