import { Router } from "express";
import YouTubeService from "../services/youtubeService.js";

const router = Router();

/**
 * POST /api/video/info
 * Get video information
 */
router.post("/info", async (req, res) => {
  try {
    const { url, videoId } = req.body;

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

    const isValid = await YouTubeService.validateVideo(id);
    if (!isValid) {
      return res.status(404).json({
        success: false,
        error: "Video not found or not accessible",
      });
    }

    const info = await YouTubeService.getVideoInfo(id);

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/video/validate/:videoId
 * Validate if video exists
 */
router.get("/validate/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const isValid = await YouTubeService.validateVideo(videoId);

    res.json({
      success: true,
      valid: isValid,
      videoId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/video/formats/:videoId
 * Get available download formats
 */
router.get("/formats/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const formats = await YouTubeService.getDownloadOptions(videoId);

    res.json({
      success: true,
      videoId,
      formats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
