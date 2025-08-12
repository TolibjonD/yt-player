import ytdl from "@distube/ytdl-core";
import NodeCache from "node-cache";

// Cache for video info (TTL: 1 hour)
const cache = new NodeCache({ stdTTL: 3600 });

class YouTubeService {
  /**
   * Extract video ID from various YouTube URL formats
   */
  static extractVideoId(url) {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  /**
   * Validate if video exists and is accessible
   */
  static async validateVideo(videoId) {
    try {
      const isValid = await ytdl.validateID(videoId);
      if (!isValid) return false;

      const info = await ytdl.getInfo(videoId);
      return info.videoDetails ? true : false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get comprehensive video information
   */
  static async getVideoInfo(videoId) {
    // Check cache first
    const cached = cache.get(videoId);
    if (cached) return cached;

    try {
      const info = await ytdl.getInfo(videoId);
      const { videoDetails, formats } = info;

      // Get audio formats
      const audioFormats = formats
        .filter((format) => format.hasAudio && !format.hasVideo)
        .map((format) => ({
          quality: format.audioQuality,
          codec: format.audioCodec,
          bitrate: format.audioBitrate,
          sampleRate: format.audioSampleRate,
          size: format.contentLength ? parseInt(format.contentLength) : null,
        }));

      const data = {
        videoId,
        title: videoDetails.title,
        description: videoDetails.description,
        duration: parseInt(videoDetails.lengthSeconds),
        durationFormatted: this.formatDuration(videoDetails.lengthSeconds),
        author: {
          name: videoDetails.author.name,
          channelId: videoDetails.author.id,
          url: videoDetails.author.channel_url,
          verified: videoDetails.author.verified,
          subscriber_count: videoDetails.author.subscriber_count,
        },
        stats: {
          views: parseInt(videoDetails.viewCount) || 0,
          likes: videoDetails.likes || 0,
          dislikes: videoDetails.dislikes || 0,
        },
        thumbnails: videoDetails.thumbnails,
        bestThumbnail:
          videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
        uploadDate: videoDetails.uploadDate,
        category: videoDetails.category,
        tags: videoDetails.keywords || [],
        isLive: videoDetails.isLiveContent,
        isPrivate: videoDetails.isPrivate,
        availableAudioFormats: audioFormats,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      };

      // Cache the result
      cache.set(videoId, data);

      return data;
    } catch (error) {
      throw new Error(`Failed to get video info: ${error.message}`);
    }
  }

  /**
   * Format duration from seconds to readable format
   */
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Get download options for a video
   */
  static async getDownloadOptions(videoId) {
    try {
      const info = await ytdl.getInfo(videoId);
      const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

      return audioFormats.map((format) => ({
        itag: format.itag,
        container: format.container,
        codec: format.audioCodec,
        quality: format.audioQuality,
        bitrate: format.audioBitrate,
        sampleRate: format.audioSampleRate,
        size: format.contentLength
          ? `${(parseInt(format.contentLength) / 1024 / 1024).toFixed(2)} MB`
          : "Unknown",
      }));
    } catch (error) {
      throw new Error(`Failed to get download options: ${error.message}`);
    }
  }
}

export default YouTubeService;
