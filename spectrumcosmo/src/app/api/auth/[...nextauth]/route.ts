export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { handlers } = await import("@/auth");
    if (!handlers || typeof handlers.GET !== "function") {
      console.error("Handlers not properly initialized");
      return new Response("Auth service unavailable", { status: 503 });
    }
    return handlers.GET(request);
  } catch (error) {
    console.error("Auth GET error:", error);
    return new Response("Auth service error", { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const { handlers } = await import("@/auth");
    if (!handlers || typeof handlers.POST !== "function") {
      console.error("Handlers not properly initialized");
      return new Response("Auth service unavailable", { status: 503 });
    }
    return handlers.POST(request);
  } catch (error) {
    console.error("Auth POST error:", error);
    return new Response("Auth service error", { status: 503 });
  }
}
