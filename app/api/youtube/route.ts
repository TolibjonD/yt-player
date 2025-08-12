import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';
import { ERROR_MESSAGES, HTTP_STATUS, DEFAULTS } from '@/lib/constants';

// Simple in-memory rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = DEFAULTS.REQUEST_WINDOW; // 1 minute
const MAX_REQUESTS_PER_WINDOW = DEFAULTS.MAX_REQUESTS; // 20 requests per minute per IP

// Helper function to check rate limit
function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const userRequests = requestCounts.get(ip);

    if (!userRequests || now > userRequests.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (userRequests.count >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }

    userRequests.count++;
    return true;
}

// Helper function to validate video ID
function isValidVideoId(videoId: string): boolean {
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

// Helper function to extract video ID from URL
function extractVideoId(url: string): string | null {
    try {
        return ytdl.getVideoID(url);
    } catch {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }
}

// Function to get video info using ytdl-core
async function getVideoInfo(videoId: string) {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Get video info
        const info = await ytdl.getInfo(videoUrl);

        // Get best audio format
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        if (audioFormats.length === 0) {
            throw new Error('No audio format available');
        }

        // Try to find MP4 format first (better browser compatibility)
        let bestAudio = audioFormats.find(f => f.url && f.url.startsWith('http') && f.container === 'mp4');

        if (!bestAudio) {
            // Fallback to any format with direct URL
            bestAudio = audioFormats.find(f => f.url && f.url.startsWith('http'));
        }

        if (!bestAudio) {
            // Fallback to highest bitrate
            bestAudio = audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
        }

        return {
            videoDetails: info.videoDetails,
            audioFormat: bestAudio,
            formats: audioFormats
        };
    } catch (error) {
        console.error('Error getting video info:', error);
        throw error;
    }
}

// Function to create a proxy stream URL
async function createProxyStreamUrl(videoId: string) {
    // Use our streaming endpoint for better compatibility and CORS handling
    return `/api/youtube/stream?videoId=${videoId}`;
}

export async function GET(request: NextRequest) {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
        return NextResponse.json(
            {
                success: false,
                error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
                suggestion: 'Please wait a minute before making another request.',
                retryAfter: DEFAULTS.RETRY_DELAY
            },
            { status: HTTP_STATUS.RATE_LIMITED }
        );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
        return NextResponse.json(
            { success: false, error: ERROR_MESSAGES.VIDEO_ID_EXTRACTION_FAILED },
            { status: HTTP_STATUS.BAD_REQUEST }
        );
    }

    if (!isValidVideoId(videoId)) {
        return NextResponse.json(
            { success: false, error: ERROR_MESSAGES.VIDEO_ID_EXTRACTION_FAILED },
            { status: HTTP_STATUS.BAD_REQUEST }
        );
    }

    try {
        const videoInfo = await getVideoInfo(videoId);
        const { videoDetails, audioFormat } = videoInfo;

        // Check if video is available
        if (!videoDetails) {
            return NextResponse.json(
                { success: false, error: ERROR_MESSAGES.VIDEO_NOT_FOUND },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        // Check for age restrictions or private videos
        if (videoDetails.isPrivate || videoDetails.isUnlisted) {
            return NextResponse.json(
                { success: false, error: ERROR_MESSAGES.VIDEO_PRIVATE },
                { status: HTTP_STATUS.FORBIDDEN }
            );
        }

        // Create proxy stream URL
        const audioUrl = await createProxyStreamUrl(videoId);

        // Prepare response
        const response = {
            success: true,
            data: {
                id: videoId,
                title: videoDetails.title,
                artist: videoDetails.author?.name || 'Unknown Artist',
                duration: parseInt(videoDetails.lengthSeconds || '0'),
                url: audioUrl,
                thumbnail: videoDetails.thumbnails?.[0]?.url || null,
                youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
                addedAt: new Date().toISOString(),
                audioBitrate: audioFormat.audioBitrate || 128,
                audioCodec: audioFormat.audioCodec || 'mp4a.40.2',
                container: audioFormat.container || 'mp4',
                contentLength: audioFormat.contentLength || '0',
                isLive: videoDetails.isLiveContent || false,
                message: 'Audio extraction successful!'
            }
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error in GET handler:', error);

        let errorMessage: string = ERROR_MESSAGES.PROCESSING_FAILED;
        let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

        if (error instanceof Error) {
            if (error.message.includes('Video unavailable')) {
                errorMessage = ERROR_MESSAGES.VIDEO_NOT_FOUND;
                statusCode = HTTP_STATUS.NOT_FOUND;
            } else if (error.message.includes('private')) {
                errorMessage = ERROR_MESSAGES.VIDEO_PRIVATE;
                statusCode = HTTP_STATUS.FORBIDDEN;
            } else if (error.message.includes('age-restricted')) {
                errorMessage = ERROR_MESSAGES.VIDEO_PRIVATE;
                statusCode = HTTP_STATUS.FORBIDDEN;
            } else if (error.message.includes('No audio format available')) {
                errorMessage = ERROR_MESSAGES.NO_AUDIO_FORMAT;
                statusCode = HTTP_STATUS.BAD_REQUEST;
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                suggestion: 'Please try again later or check if the video is available.',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: statusCode }
        );
    }
}

// For development/testing purposes, you can also add a POST endpoint
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'URL is required' },
                { status: 400 }
            );
        }

        // Extract video ID from URL
        const videoId = extractVideoId(url);

        if (!videoId) {
            return NextResponse.json(
                { success: false, error: 'Invalid YouTube URL' },
                { status: 400 }
            );
        }

        // Reuse the GET logic by calling it internally
        const getRequest = new NextRequest(`/api/youtube?videoId=${videoId}`);
        return await GET(getRequest);

    } catch (error) {
        console.error('Error processing YouTube URL:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process URL'
            },
            { status: 500 }
        );
    }
} 