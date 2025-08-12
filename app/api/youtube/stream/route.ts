import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
        return NextResponse.json(
            { success: false, error: 'Video ID is required' },
            { status: 400 }
        );
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Get video info to validate
        const info = await ytdl.getInfo(videoUrl);

        // Check if video is available
        if (!info.videoDetails) {
            return NextResponse.json(
                { success: false, error: 'Video not found or unavailable' },
                { status: 404 }
            );
        }

        // Check for restrictions
        if (info.videoDetails.isPrivate || info.videoDetails.isUnlisted) {
            return NextResponse.json(
                { success: false, error: 'This video is private or unlisted' },
                { status: 403 }
            );
        }

        // Get audio formats and select MP4 if available
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const mp4Format = audioFormats.find(f => f.container === 'mp4');

        // Create audio stream with preferred format
        const audioStream = ytdl(videoUrl, {
            filter: 'audioonly',
            quality: 'highestaudio',
            format: mp4Format,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        });

        // Set appropriate headers for audio streaming
        const headers = new Headers();
        headers.set('Content-Type', mp4Format ? 'audio/mp4' : 'audio/mpeg');
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Range, Content-Type');
        headers.set('Content-Disposition', 'inline');

        // Convert stream to Response using ReadableStream
        const readable = new ReadableStream({
            start(controller) {
                audioStream.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });
                audioStream.on('end', () => {
                    controller.close();
                });
                audioStream.on('error', (err) => {
                    controller.error(err);
                });
            }
        });

        const response = new Response(readable, {
            headers,
            status: 200,
        });

        return response;

    } catch (error) {
        console.error('Error streaming audio:', error);

        let errorMessage = 'Failed to stream audio';
        let statusCode = 500;

        if (error instanceof Error) {
            if (error.message.includes('Video unavailable')) {
                errorMessage = 'This video is not available or has been removed';
                statusCode = 404;
            } else if (error.message.includes('private')) {
                errorMessage = 'This video is private and cannot be accessed';
                statusCode = 403;
            } else if (error.message.includes('age-restricted')) {
                errorMessage = 'This video is age-restricted and cannot be processed';
                statusCode = 403;
            } else {
                errorMessage = error.message;
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                suggestion: 'Please try again later or check if the video is available.'
            },
            { status: statusCode }
        );
    }
}

export async function HEAD(request: NextRequest) {
    // Handle HEAD requests for range requests
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
        return new Response(null, { status: 400 });
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        await ytdl.getInfo(videoUrl);

        const headers = new Headers();
        headers.set('Content-Type', 'audio/mpeg');
        headers.set('Accept-Ranges', 'bytes');
        headers.set('Content-Length', '0'); // We don't know the exact length
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Range');

        return new Response(null, { headers, status: 200 });
    } catch {
        return new Response(null, { status: 404 });
    }
}

export async function OPTIONS() {
    // Handle CORS preflight requests
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Range, Content-Type');
    headers.set('Access-Control-Max-Age', '86400');

    return new Response(null, { headers, status: 200 });
}
