export async function GET() {
  return Response.json({
    message: "Hello from openvite on Cloudflare Workers!",
    runtime: typeof globalThis.navigator !== "undefined"
      ? (globalThis.navigator as { userAgent?: string }).userAgent
      : "unknown",
  });
}
