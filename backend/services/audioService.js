import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { createWriteStream, createReadStream } from "fs";
import { unlink } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class AudioService {
  /**
   * Extract audio from YouTube video and convert to MP3
   */
  static async extractAudio(videoId, options = {}) {
    const { quality = "highest", bitrate = "192", format = "mp3" } = options;

    const outputFileName = `${videoId}_${Date.now()}.${format}`;
    const outputPath = join(__dirname, "..", "downloads", outputFileName);

    return new Promise((resolve, reject) => {
      const stream = ytdl(videoId, {
        quality: "highestaudio",
        filter: "audioonly",
      });

      const startTime = Date.now();

      ffmpeg(stream)
        .audioBitrate(bitrate)
        .audioCodec("libmp3lame")
        .audioQuality(0) // Best quality
        .toFormat(format)
        .on("error", (error) => {
          console.error("FFmpeg error:", error);
          reject(new Error(`Conversion failed: ${error.message}`));
        })
        .on("progress", (progress) => {
          console.log(`Processing: ${progress.percent?.toFixed(2)}% done`);
        })
        .on("end", () => {
          const processingTime = Date.now() - startTime;
          console.log(`Audio extraction completed in ${processingTime}ms`);
          resolve({
            fileName: outputFileName,
            path: outputPath,
            format,
            bitrate,
            processingTime,
          });
        })
        .save(outputPath);
    });
  }

  /**
   * Stream audio directly without saving to disk
   */
  static streamAudio(videoId, res) {
    try {
      const stream = ytdl(videoId, {
        quality: "highestaudio",
        filter: "audioonly",
      });

      // Set response headers
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${videoId}.mp3"`
      );

      // Pipe through ffmpeg for conversion
      ffmpeg(stream)
        .audioBitrate("192")
        .audioCodec("libmp3lame")
        .toFormat("mp3")
        .on("error", (error) => {
          console.error("Streaming error:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Streaming failed" });
          }
        })
        .pipe(res, { end: true });
    } catch (error) {
      throw new Error(`Failed to stream audio: ${error.message}`);
    }
  }

  /**
   * Generate unique download ID
   */
  static generateDownloadId(videoId) {
    return crypto
      .createHash("md5")
      .update(`${videoId}-${Date.now()}`)
      .digest("hex");
  }

  /**
   * Clean up temporary files
   */
  static async cleanup(filePath) {
    try {
      await unlink(filePath);
      console.log(`Cleaned up: ${filePath}`);
    } catch (error) {
      console.error(`Cleanup failed: ${error.message}`);
    }
  }
}

export default AudioService;
