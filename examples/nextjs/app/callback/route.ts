import { handleLoopbackCallback } from "@/lib/handleCallback";

// Claude's loopback redirect path (RFC 8252, port-agnostic).
export function GET(request: Request) {
  return handleLoopbackCallback(request);
}
