import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId') || 'dQw4w9WgXcQ'; // Default to Rick Astley

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Get video info
        const info = await ytdl.getInfo(videoUrl);

        // Get audio formats
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
        const bestAudio = audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];

        if (!bestAudio) {
            return NextResponse.json({
                success: false,
                error: 'No audio format available'
            });
        }

        return NextResponse.json({
            success: true,
            videoDetails: {
                title: info.videoDetails.title,
                author: info.videoDetails.author?.name,
                duration: info.videoDetails.lengthSeconds,
            },
            audioFormat: {
                url: bestAudio.url,
                audioBitrate: bestAudio.audioBitrate,
                audioCodec: bestAudio.audioCodec,
                container: bestAudio.container,
                contentLength: bestAudio.contentLength,
            },
            allFormats: audioFormats.map(f => ({
                url: f.url,
                audioBitrate: f.audioBitrate,
                audioCodec: f.audioCodec,
                container: f.container,
            }))
        });

    } catch (error) {
        console.error('Test audio error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
