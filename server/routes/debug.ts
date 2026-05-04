import { RequestHandler } from "express";
import { getConnectionStatus } from "../db";

// Debug endpoint to check environment and database status
export const handleDebugStatus: RequestHandler = async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        status: getConnectionStatus(),
        mongoUri: process.env.MONGODB_URI ? "✅ Set" : "❌ Missing",
      },
      jwt: {
        secret: process.env.JWT_SECRET ? "✅ Set" : "❌ Missing",
        expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      },
      cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS || "Default localhost",
      },
      server: {
        port: process.env.PORT || "8080",
        platform: process.platform,
        nodeVersion: process.version,
      }
    };

    // Only show in development or if specifically requested
    if (process.env.NODE_ENV === "production" && !req.query.force) {
      return res.status(403).json({ 
        success: false, 
        message: "Debug endpoint disabled in production" 
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error("Debug status error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting debug status",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
};