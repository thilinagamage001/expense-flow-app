import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const startTime = Date.now();

  try {
    // Check database connectivity
    await db.$queryRaw`SELECT 1`;

    const responseTime = Date.now() - startTime;

    logger.info("Health check passed", { responseTime });

    return Response.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "connected",
        responseTime: `${responseTime}ms`,
      },
      { status: 200 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;

    logger.error("Health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime,
    });

    return Response.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: "disconnected",
        responseTime: `${responseTime}ms`,
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
