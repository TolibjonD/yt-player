import { Suspense } from "react";
import { Metadata } from "next";
import HomeClient from "@/components/home-client";

export const metadata: Metadata = {
  title: "YT Player - YouTube to MP3 Converter",
  description: "Convert YouTube videos to high-quality MP3 audio with our modern, feature-rich player",
  keywords: ["YouTube to MP3", "audio converter", "music player", "playlist manager"],
  openGraph: {
    title: "YT Player - YouTube to MP3 Converter",
    description: "Convert YouTube videos to high-quality MP3 audio with our modern, feature-rich player",
    type: "website",
    url: "https://saidy-player.netlify.app",
    siteName: "YT Player",
  },
  twitter: {
    card: "summary_large_image",
    title: "YT Player - YouTube to MP3 Converter",
    description: "Convert YouTube videos to high-quality MP3 audio with our modern, feature-rich player",
  },
};

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-16 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
    </div>
  </div>
);

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeClient />
    </Suspense>
  );
}