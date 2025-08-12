import { Router } from "express";
import YouTubeService from "../services/youtubeService.js";
import AudioService from "../services/audioService.js";
import { createReadStream, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Store active downloads
const activeDownloads = new Map();

/**
 * POST /api/audio/extract
 * Extract audio from video and convert to MP3
 */
router.post("/extract", async (req, res) => {
  try {
    const { url, videoId, quality = "highest", bitrate = "192" } = req.body;

    if (!url && !videoId) {
      return res.status(400).json({
        success: false,
        error: "URL or video ID is required",
      });
    }

    const id = videoId || YouTubeService.extractVideoId(url);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Invalid YouTube URL or video ID",
      });
    }

    // Validate video
    const isValid = await YouTubeService.validateVideo(id);
    if (!isValid) {
      return res.status(404).json({
        success: false,
        error: "Video not found or not accessible",
      });
    }

    // Get video info
    const videoInfo = await YouTubeService.getVideoInfo(id);

    // Check if already processing
    if (activeDownloads.has(id)) {
      return res.json({
        success: true,
        message: "Already processing",
        downloadId: activeDownloads.get(id),
      });
    }

    // Generate download ID
    const downloadId = AudioService.generateDownloadId(id);
    activeDownloads.set(id, downloadId);

    // Extract audio
    const result = await AudioService.extractAudio(id, { quality, bitrate });

    // Store download info
    activeDownloads.set(downloadId, {
      ...result,
      videoInfo: {
        title: videoInfo.title,
        author: videoInfo.author.name,
        duration: videoInfo.durationFormatted,
      },
      createdAt: new Date(),
    });

    // Remove from processing
    activeDownloads.delete(id);

    res.json({
      success: true,
      message: "Audio extracted successfully",
      downloadId,
      downloadUrl: `/api/audio/download/${downloadId}`,
      data: {
        fileName: result.fileName,
        format: result.format,
        bitrate: result.bitrate,
        processingTime: `${result.processingTime}ms`,
        videoTitle: videoInfo.title,
        duration: videoInfo.durationFormatted,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/audio/download/:downloadId
 * Download extracted MP3 file
 */
router.get("/download/:downloadId", (req, res) => {
  try {
    const { downloadId } = req.params;
    const downloadInfo = activeDownloads.get(downloadId);

    if (!downloadInfo) {
      return res.status(404).json({
        success: false,
        error: "Download not found or expired",
      });
    }

    const filePath = downloadInfo.path;

    if (!existsSync(filePath)) {
      activeDownloads.delete(downloadId);
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    // Set headers for download
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${downloadInfo.videoInfo.title}.mp3"`
    );

    // Stream file
    const stream = createReadStream(filePath);
    stream.pipe(res);

    // Clean up after download
    stream.on("end", () => {
      setTimeout(() => {
        AudioService.cleanup(filePath);
        activeDownloads.delete(downloadId);
      }, 5000); // Wait 5 seconds before cleanup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/audio/stream
 * Stream audio directly without saving
 */
router.get("/stream", async (req, res) => {
  try {
    const { url, videoId } = req.query;

    if (!url && !videoId) {
      return res.status(400).json({
        success: false,
        error: "URL or video ID is required",
      });
    }

    const id = videoId || YouTubeService.extractVideoId(url);

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Invalid YouTube URL or video ID",
      });
    }

    // Stream audio directly
    AudioService.streamAudio(id, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
