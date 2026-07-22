// src/app/api/auth/[...nextauth]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { handlers } = await import("@/auth");
  return handlers.GET(request);
}

export async function POST(request: Request) {
  const { handlers } = await import("@/auth");
  return handlers.POST(request);
}
