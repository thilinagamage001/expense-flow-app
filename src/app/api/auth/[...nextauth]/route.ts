import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const handler = NextAuth(authOptions);

async function rateLimitedHandler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const identifier = getClientIdentifier(req);
  const result = rateLimit(`auth:${identifier}`, 10, 15 * 60 * 1000); // 10 attempts per 15 minutes

  if (!result.success) {
    logger.warn("Rate limit exceeded for auth endpoint", {
      identifier,
      retryAfter: result.retryAfter,
    });

    return Response.json(
      {
        error: "Too many attempts. Please try again later.",
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = await handler(req, ctx);
  response.headers.set("X-RateLimit-Limit", "10");
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetTime / 1000)));

  return response;
}

export { handler as GET, rateLimitedHandler as POST };
