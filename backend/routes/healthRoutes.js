import { Router } from "express";
import os from "os";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    system: {
      platform: os.platform(),
      memory: {
        free: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        total: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usage: `${((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)}%`,
      },
      cpus: os.cpus().length,
    },
  });
});

export default router;
