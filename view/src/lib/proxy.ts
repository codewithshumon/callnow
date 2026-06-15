// Server-side proxy to NestJS backend
// Called from route.ts handlers — never exposed to client

const BACKEND_URL = process.env.NESTJS_API_URL || "http://localhost:4000";
const BASE_PATH = "/api/v1";

interface ProxyOptions {
  method: string;
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

export async function proxyToBackend(path: string, options: ProxyOptions) {
  const url = new URL(`${BACKEND_URL}${BASE_PATH}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  };

  if (options.body && options.method !== "GET") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), fetchOptions);
  const data = await res.json();

  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

// Extract JWT from incoming request Authorization header
export function getAuthToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
