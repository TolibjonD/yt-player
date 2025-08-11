import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

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

// Helper function to get video info with retries using ytdl-core
async function getVideoInfoWithYtdl(videoUrl: string, maxRetries = 5): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt} to fetch video info with ytdl-core for: ${videoUrl}`);
            const videoInfo = await ytdl.getInfo(videoUrl);
            return videoInfo;
        } catch (error) {
            console.error(`Attempt ${attempt} failed with ytdl-core:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
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

export async function GET(request: NextRequest) {
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
        let audioFormat: any;

        // Use ytdl-core with retries
        videoInfo = await getVideoInfoWithYtdl(videoUrl);
        audioFormat = getBestAudioFormat(videoInfo.formats);

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

        // Get audio URL
        const audioUrl = audioFormat.url || '';

        if (!audioUrl) {
            return NextResponse.json(
                { success: false, error: 'Could not extract audio URL' },
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

        if (error instanceof Error) {
            if (error.message.includes('Could not extract functions')) {
                errorMessage = 'YouTube has updated their system. Please try again later or use a different video.';
            } else if (error.message.includes('Video unavailable')) {
                errorMessage = 'This video is not available or has been removed.';
            } else if (error.message.includes('Private video')) {
                errorMessage = 'This video is private and cannot be accessed.';
            } else if (error.message.includes('Age-restricted')) {
                errorMessage = 'This video is age-restricted and cannot be processed.';
            } else if (error.message.includes('Sign in to confirm your age')) {
                errorMessage = 'This video requires age verification and cannot be processed.';
            } else if (error.message.includes('This video is not available')) {
                errorMessage = 'This video is not available in your region or has been removed.';
            } else if (error.message.includes('No audio format available')) {
                errorMessage = 'No audio format is available for this video.';
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
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