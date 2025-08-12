import { Metadata } from 'next';
import HomeClient from '@/components/home-client';

export const metadata: Metadata = {
    title: 'YouTube MP3 Player - Demo',
    description: 'Try out the YouTube MP3 Player with example videos',
};

export default function DemoPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            <div className="container mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        YouTube MP3 Player Demo
                    </h1>
                    <p className="text-lg text-gray-300 mb-6">
                        Try these example YouTube videos to test the audio extraction
                    </p>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">Example Videos</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                            <div className="bg-white/5 rounded-lg p-4">
                                <h3 className="font-medium text-white mb-2">Rick Astley - Never Gonna Give You Up</h3>
                                <p className="text-sm text-gray-300 mb-2">A classic song for testing</p>
                                <code className="text-xs text-green-400 break-all">
                                    https://www.youtube.com/watch?v=dQw4w9WgXcQ
                                </code>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4">
                                <h3 className="font-medium text-white mb-2">Lofi Hip Hop Radio</h3>
                                <p className="text-sm text-gray-300 mb-2">Relaxing background music</p>
                                <code className="text-xs text-green-400 break-all">
                                    https://www.youtube.com/watch?v=jfKfPfyJRdk
                                </code>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4">
                                <h3 className="font-medium text-white mb-2">Classical Music</h3>
                                <p className="text-sm text-gray-300 mb-2">Beethoven Symphony No. 5</p>
                                <code className="text-xs text-green-400 break-all">
                                    https://www.youtube.com/watch?v=9E6b3swbnWg
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                <HomeClient />
            </div>
        </div>
    );
}
