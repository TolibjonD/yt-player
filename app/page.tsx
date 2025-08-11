"use client";

import { useState, useMemo, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Play,
  Heart,
  Download,
  List,
  Settings,
  Plus,
  Youtube,
  Sparkles
} from "lucide-react";
import Header from "@/components/header";
import UrlInput from "@/components/url-input";
import Player from "@/components/player";
import { cn } from "@/lib/utils";
import { usePlaylist, usePlayerActions } from "@/store/player-store";

// Lazy load components for better performance
const Playlist = lazy(() => import("@/components/playlist"));

// Optimized animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
  },
  hover: {
    scale: 1.02,
    y: -4,
  },
};

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
    </div>
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState<'input' | 'playlist'>('input');

  // Get playlist data from store
  const { currentPlaylist, playlists, likedTracks, downloadCount } = usePlaylist();
  const { addTrack, toggleLikedTrack, incrementDownloadCount } = usePlayerActions();

  // Calculate dynamic stats
  const totalTracks = useMemo(() => {
    if (currentPlaylist) {
      return currentPlaylist.tracks.length;
    }
    return playlists.reduce((total, playlist) => total + playlist.tracks.length, 0);
  }, [currentPlaylist, playlists]);

  const totalPlaylists = useMemo(() => {
    return playlists.length;
  }, [playlists]);

  const totalLikedTracks = useMemo(() => {
    return likedTracks.length;
  }, [likedTracks]);

  // Memoized stats data with dynamic values
  const statsData = useMemo(() => [
    {
      icon: Music,
      label: "Total Tracks",
      value: totalTracks.toString(),
      color: "text-gradient",
      bgColor: "from-rose-500/20 to-orange-500/20"
    },
    {
      icon: Play,
      label: "Playlists",
      value: totalPlaylists.toString(),
      color: "text-green-500",
      bgColor: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: Heart,
      label: "Liked Tracks",
      value: totalLikedTracks.toString(),
      color: "text-rose-500",
      bgColor: "from-rose-500/20 to-pink-500/20"
    },
    {
      icon: Download,
      label: "Downloads",
      value: downloadCount.toString(),
      color: "text-purple-500",
      bgColor: "from-purple-500/20 to-violet-500/20"
    }
  ], [totalTracks, totalPlaylists, totalLikedTracks, downloadCount]);

  // Memoized features data
  const featuresData = useMemo(() => [
    {
      icon: Play,
      title: "High Quality Audio",
      description: "Convert YouTube videos to high-quality MP3 files with crystal clear sound",
      color: "text-gradient",
      bgColor: "from-rose-500/20 to-orange-500/20"
    },
    {
      icon: List,
      title: "Smart Playlists",
      description: "Organize your music with intelligent playlists and easy management",
      color: "text-green-500",
      bgColor: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: Settings,
      title: "Advanced Controls",
      description: "Full control over playback with shuffle, repeat, and volume controls",
      color: "text-purple-500",
      bgColor: "from-purple-500/20 to-violet-500/20"
    }
  ], []);

  // Function to handle track like
  const handleTrackLike = (trackId: string) => {
    toggleLikedTrack(trackId);
  };

  // Function to handle download
  const handleDownload = () => {
    incrementDownloadCount();
  };

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{
            staggerChildren: 0.1,
            delayChildren: 0.2,
          }}
        >
          {/* Left Column - URL Input */}
          <motion.div
            className="lg:col-span-1"
            variants={itemVariants}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="sticky top-24">
              <UrlInput />
            </div>
          </motion.div>

          {/* Right Column - Playlist */}
          <motion.div
            className="lg:col-span-2"
            variants={itemVariants}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="card-hover h-[calc(100vh-12rem)] overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-white/20 dark:border-white/10">
                <button
                  onClick={() => setActiveTab('input')}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 relative",
                    activeTab === 'input'
                      ? "text-gradient bg-gradient-to-r from-rose-500/10 to-orange-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Youtube className="h-4 w-4" />
                    <span>Add Tracks</span>
                  </div>
                  <AnimatePresence>
                    {activeTab === 'input' && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-orange-500"
                        layoutId="activeTab"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>
                </button>
                <button
                  onClick={() => setActiveTab('playlist')}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 relative",
                    activeTab === 'playlist'
                      ? "text-gradient bg-gradient-to-r from-rose-500/10 to-orange-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <List className="h-4 w-4" />
                    <span>Playlist</span>
                  </div>
                  <AnimatePresence>
                    {activeTab === 'playlist' && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-orange-500"
                        layoutId="activeTab"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </AnimatePresence>
                </button>
              </div>

              {/* Tab Content */}
              <div className="h-full">
                <AnimatePresence mode="wait">
                  {activeTab === 'input' ? (
                    <motion.div
                      key="input"
                      className="h-full flex flex-col items-center justify-center p-8 text-center"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <motion.div
                        className="w-20 h-20 glass-effect rounded-full flex items-center justify-center mb-6"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      >
                        <Youtube className="h-10 w-10 text-gradient" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2 text-gradient">Add YouTube Tracks</h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        Paste a YouTube URL in the input field to convert it to MP3 and add it to your playlist
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Sparkles className="h-4 w-4 text-rose-500" />
                          <span>High Quality Audio</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Sparkles className="h-4 w-4 text-orange-500" />
                          <span>Instant Conversion</span>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="playlist"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <Suspense fallback={<LoadingSpinner />}>
                        <Playlist
                          onTrackLike={handleTrackLike}
                          onTrackDownload={handleDownload}
                          likedTracks={likedTracks}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{
            staggerChildren: 0.1,
            delayChildren: 0.2,
          }}
        >
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="card-hover p-4 shining-effect"
              variants={cardVariants}
              whileHover="hover"
              transition={{
                delay: index * 0.1,
                duration: 0.4,
                ease: "easeOut"
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={cn("w-10 h-10 bg-gradient-to-r rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={cn("text-lg font-semibold", stat.color)}>{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Section */}
        <motion.section
          className="mt-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{
            staggerChildren: 0.1,
            delayChildren: 0.2,
          }}
        >
          <motion.div
            className="text-center mb-12"
            variants={itemVariants}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-3xl font-bold mb-4 text-gradient">Why Choose YT Player?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the best YouTube to MP3 conversion with our modern, feature-rich player
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuresData.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card-hover text-center p-6 shining-effect"
                variants={cardVariants}
                whileHover="hover"
                transition={{
                  delay: index * 0.1,
                  duration: 0.4,
                  ease: "easeOut"
                }}
              >
                <div className={cn("w-16 h-16 bg-gradient-to-r rounded-full flex items-center justify-center mx-auto mb-4", feature.bgColor)}>
                  <feature.icon className={cn("h-8 w-8", feature.color)} />
                </div>
                <h3 className={cn("text-xl font-semibold mb-2", feature.color)}>{feature.title}</h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Player */}
      <Player />
    </div>
  );
}