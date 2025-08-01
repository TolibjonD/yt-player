"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
import Playlist from "@/components/playlist";
import Player from "@/components/player";
import { cn } from "@/lib/utils";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'input' | 'playlist'>('input');

  return (
    <div className="min-h-screen animated-bg">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - URL Input */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="sticky top-24">
              <UrlInput />
            </div>
          </motion.div>

          {/* Right Column - Playlist */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
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
                  {activeTab === 'input' && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-orange-500"
                      layoutId="activeTab"
                    />
                  )}
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
                  {activeTab === 'playlist' && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-rose-500 to-orange-500"
                      layoutId="activeTab"
                    />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="h-full">
                {activeTab === 'input' ? (
                  <motion.div
                    className="h-full flex flex-col items-center justify-center p-8 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      className="w-20 h-20 glass-effect rounded-full flex items-center justify-center mb-6"
                      whileHover={{ scale: 1.1 }}
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
                  <Playlist />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="card-hover p-4 shining-effect"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                <Music className="h-5 w-5 text-gradient" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tracks</p>
                <p className="text-lg font-semibold text-gradient">0</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="card-hover p-4 shining-effect"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Playlists</p>
                <p className="text-lg font-semibold text-green-500">0</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="card-hover p-4 shining-effect"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-rose-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Liked Tracks</p>
                <p className="text-lg font-semibold text-rose-500">0</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="card-hover p-4 shining-effect"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Downloads</p>
                <p className="text-lg font-semibold text-purple-500">0</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.section
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gradient">Why Choose YT Player?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the best YouTube to MP3 conversion with our modern, feature-rich player
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              className="card-hover text-center p-6 shining-effect"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-rose-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-gradient" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gradient">High Quality Audio</h3>
              <p className="text-muted-foreground">
                Convert YouTube videos to high-quality MP3 files with crystal clear sound
              </p>
            </motion.div>

            <motion.div
              className="card-hover text-center p-6 shining-effect"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <List className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-500">Smart Playlists</h3>
              <p className="text-muted-foreground">
                Organize your music with intelligent playlists and easy management
              </p>
            </motion.div>

            <motion.div
              className="card-hover text-center p-6 shining-effect"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-purple-500">Advanced Controls</h3>
              <p className="text-muted-foreground">
                Full control over playback with shuffle, repeat, and volume controls
              </p>
            </motion.div>
          </div>
        </motion.section>
      </main>

      {/* Player */}
      <Player />
    </div>
  );
}