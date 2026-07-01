import { handleLoopbackCallback } from "@/lib/handleCallback";

// OpenAI/Codex's loopback redirect path (requires the app to run on port 1455).
export function GET(request: Request) {
  return handleLoopbackCallback(request);
}
