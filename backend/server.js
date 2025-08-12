import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import { createWriteStream, existsSync } from "fs";
import NodeCache from "node-cache";

// Import routes
import videoRoutes from "./routes/videoRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Create temp and downloads directories
const TEMP_DIR = join(__dirname, "temp");
const DOWNLOADS_DIR = join(__dirname, "downloads");

async function createDirectories() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    await fs.mkdir(DOWNLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating directories:", error);
  }
}

createDirectories();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit downloads to 10 per 15 minutes
  message: "Download limit exceeded. Please try again later.",
});

app.use("/api/", limiter);
app.use("/api/download/", downloadLimiter);

// Routes
app.use("/api/video", videoRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/health", healthRoutes);

// Static files for downloads
app.use("/downloads", express.static(DOWNLOADS_DIR));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "YouTube MP3 API",
    version: "1.0.0",
    endpoints: {
      "GET /api/health": "Health check",
      "POST /api/video/info": "Get video information",
      "POST /api/audio/extract": "Extract audio as MP3",
      "GET /api/audio/download/:id": "Download extracted MP3",
      "GET /api/audio/stream": "Stream audio directly",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Cleanup old files periodically
setInterval(async () => {
  try {
    const files = await fs.readdir(DOWNLOADS_DIR);
    const now = Date.now();
    const maxAge = 3600000; // 1 hour

    for (const file of files) {
      const filePath = join(DOWNLOADS_DIR, file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}, 1800000); // Run every 30 minutes

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Temp directory: ${TEMP_DIR}`);
  console.log(`📁 Downloads directory: ${DOWNLOADS_DIR}`);
});

export default app;
