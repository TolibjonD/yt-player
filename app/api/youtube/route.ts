import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

// Simple in-memory rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

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

// Rotate user agents to avoid bot detection
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

function getRandomUserAgent(): string {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Fallback method using different approach
async function getVideoInfoFallback(videoUrl: string): Promise<any> {
    try {
        console.log('Trying fallback method...');

        // Try with minimal options
        const fallbackOptions = {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept': '*/*',
                },
            },
            lang: 'en',
        };

        const videoInfo = await ytdl.getInfo(videoUrl, fallbackOptions);
        return videoInfo;
    } catch (error) {
        console.error('Fallback method failed:', error);
        throw error;
    }
}

// Helper function to get video info with retries using ytdl-core
async function getVideoInfoWithYtdl(videoUrl: string, maxRetries = 2): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to fetch video info with ytdl-core for: ${videoUrl}`);

            // Configure ytdl with custom options to avoid bot detection
            const options = {
                requestOptions: {
                    headers: {
                        'User-Agent': getRandomUserAgent(),
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Cache-Control': 'max-age=0',
                    },
                },
                lang: 'en',
                range: {
                    start: 0,
                    end: 1024 * 1024, // 1MB range
                },
            };

            const videoInfo = await ytdl.getInfo(videoUrl, options);
            return videoInfo;
        } catch (error) {
            console.error(`Attempt ${attempt} failed with ytdl-core:`, error);

            // Check if it's a bot detection error
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase();
                if (errorMessage.includes('sign in to confirm') ||
                    errorMessage.includes('not a bot') ||
                    errorMessage.includes('bot') ||
                    errorMessage.includes('captcha') ||
                    errorMessage.includes('verify')) {

                    console.log('Bot detection detected, trying fallback...');

                    // Try fallback method
                    try {
                        return await getVideoInfoFallback(videoUrl);
                    } catch (fallbackError) {
                        console.error('Fallback method also failed:', fallbackError);
                    }
                }
            }

            if (attempt === maxRetries) {
                throw error;
            }

            // Wait before retrying with exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Helper function to get best audio format from ytdl-core
function getBestAudioFormat(formats: any[]): any {
    const audioFormats = ytdl.filterFormats(formats, 'audioonly');

    if (!audioFormats || audioFormats.length === 0) {
        throw new Error('No audio format available for this video');
    }

    // Sort by quality and get the best one
    return audioFormats.sort((a, b) => {
        const aBitrate = a.audioBitrate || 0;
        const bBitrate = b.audioBitrate || 0;
        return bBitrate - aBitrate;
    })[0];
}

// Helper function to check if video is available
function isVideoAvailable(videoInfo: any): boolean {
    if (!videoInfo || !videoInfo.videoDetails) {
        return false;
    }

    const details = videoInfo.videoDetails;

    // Check for common unavailable indicators
    const unavailableKeywords = [
        'unavailable', 'private', 'deleted', 'removed', 'restricted',
        'age restricted', 'sign in to confirm', 'not available'
    ];

    const title = details.title?.toLowerCase() || '';
    const description = details.description?.toLowerCase() || '';

    return !unavailableKeywords.some(keyword =>
        title.includes(keyword) || description.includes(keyword)
    );
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
                error: 'Rate limit exceeded',
                suggestion: 'Please wait a minute before making another request.',
                retryAfter: 60
            },
            { status: 429 }
        );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
        return NextResponse.json(
            { success: false, error: 'Video ID is required' },
            { status: 400 }
        );
    }

    if (!isValidVideoId(videoId)) {
        return NextResponse.json(
            { success: false, error: 'Invalid video ID format' },
            { status: 400 }
        );
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        let videoInfo: any;

        // Try to get video info with multiple approaches
        try {
            videoInfo = await getVideoInfoWithYtdl(videoUrl);
        } catch (error) {
            console.error('All extraction methods failed:', error);

            // Return a more user-friendly error message
            let errorMessage = 'Failed to process video';
            let suggestion = 'Please try again later or use a different video.';

            if (error instanceof Error) {
                const errorText = error.message.toLowerCase();

                if (errorText.includes('sign in to confirm') || errorText.includes('not a bot')) {
                    errorMessage = 'YouTube is currently blocking automated requests.';
                    suggestion = 'This is a temporary issue. Please try again in a few minutes or use a different video.';
                } else if (errorText.includes('video unavailable')) {
                    errorMessage = 'This video is not available or has been removed.';
                    suggestion = 'Try using a different YouTube video.';
                } else if (errorText.includes('private video')) {
                    errorMessage = 'This video is private and cannot be accessed.';
                    suggestion = 'Try using a public YouTube video.';
                } else if (errorText.includes('age-restricted')) {
                    errorMessage = 'This video is age-restricted and cannot be processed.';
                    suggestion = 'Try using a different YouTube video.';
                } else if (errorText.includes('no audio format available')) {
                    errorMessage = 'No audio format is available for this video.';
                    suggestion = 'This video might not have audio or is not available for audio extraction.';
                } else {
                    errorMessage = 'Unable to process this video at the moment.';
                    suggestion = 'This might be due to YouTube restrictions. Please try again later.';
                }
            }

            return NextResponse.json(
                {
                    success: false,
                    error: errorMessage,
                    suggestion: suggestion,
                    details: error instanceof Error ? error.message : 'Unknown error',
                    retryAfter: 300 // Suggest retry after 5 minutes
                },
                { status: 503 }
            );
        }

        // Check if video is available
        if (!isVideoAvailable(videoInfo)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'This video is not available for processing',
                    suggestion: 'Try using a different YouTube video.'
                },
                { status: 400 }
            );
        }

        // Extract video details
        const videoDetails = videoInfo.videoDetails;

        if (!videoDetails) {
            return NextResponse.json(
                { success: false, error: 'Could not extract video details' },
                { status: 400 }
            );
        }

        // Get title and author
        const title = videoDetails.title || 'Unknown Title';
        const author = videoDetails.author?.name || videoDetails.author || 'Unknown Artist';

        // Get duration
        let duration = 0;
        if (videoDetails.lengthSeconds) {
            duration = parseInt(videoDetails.lengthSeconds);
        } else if (videoDetails.duration) {
            duration = parseInt(videoDetails.duration);
        }

        // Get thumbnail
        let thumbnail = '';
        if (videoDetails.thumbnails && videoDetails.thumbnails.length > 0) {
            thumbnail = videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url;
        }
        if (!thumbnail) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }

        // Get audio format
        let audioFormat: any;
        try {
            audioFormat = getBestAudioFormat(videoInfo.formats);
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No audio format available for this video',
                    suggestion: 'This video might not have audio or is not available for audio extraction.'
                },
                { status: 400 }
            );
        }

        // Get audio URL
        const audioUrl = audioFormat.url || '';

        if (!audioUrl) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Could not extract audio URL',
                    suggestion: 'This video might not be available for audio extraction.'
                },
                { status: 400 }
            );
        }

        // Get quality info
        const quality = audioFormat.audioBitrate || 'Unknown';

        return NextResponse.json({
            success: true,
            title: title,
            author: author,
            duration: duration,
            thumbnail: thumbnail,
            audioUrl: audioUrl,
            videoId: videoId,
            quality: `${quality}kbps`,
            method: 'ytdl-core',
            note: 'Real YouTube audio extraction'
        });

    } catch (error) {
        console.error('Error processing video:', error);

        let errorMessage = 'Failed to process video';
        let suggestion = 'Please try again later.';

        if (error instanceof Error) {
            const errorText = error.message.toLowerCase();

            if (errorText.includes('sign in to confirm') || errorText.includes('not a bot')) {
                errorMessage = 'YouTube is currently blocking automated requests.';
                suggestion = 'Please try again later or use a different video.';
            } else if (errorText.includes('video unavailable')) {
                errorMessage = 'This video is not available or has been removed.';
                suggestion = 'Try using a different YouTube video.';
            } else if (errorText.includes('private video')) {
                errorMessage = 'This video is private and cannot be accessed.';
                suggestion = 'Try using a public YouTube video.';
            } else if (errorText.includes('age-restricted')) {
                errorMessage = 'This video is age-restricted and cannot be processed.';
                suggestion = 'Try using a different YouTube video.';
            } else if (errorText.includes('no audio format available')) {
                errorMessage = 'No audio format is available for this video.';
                suggestion = 'This video might not have audio or is not available for audio extraction.';
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                suggestion: suggestion,
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
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