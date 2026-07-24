export async function GET() {
  return Response.json({
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    secretLength: process.env.NEXTAUTH_SECRET?.length ?? 0,
    hasUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
    hasDbUrl: !!process.env.DATABASE_URL,
  });
}