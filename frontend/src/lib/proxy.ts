// Server-side proxy to NestJS backend — Next.js BFF cookie manager.
//
// FLOW:
//   Browser → Next.js route handler → proxyToBackend() → NestJS backend
//
//   OUTBOUND (browser → backend):
//     - Reads access_token from browser's httpOnly cookie
//     - Sets Authorization: Bearer <token> header before forwarding
//
//   INBOUND (backend → browser):
//     - On auth responses (login/refresh/google/2fa/phone): extracts tokens
//       from response body, sets httpOnly cookies, strips tokens from body
//     - On all other responses: passes through unchanged

import { cookies } from "next/headers";

const BACKEND_URL = process.env.NESTJS_API_URL || "http://localhost:4000";
const BASE_PATH = "/api/v1";

const ACCESS_TTL = 15 * 60;          // 15 min
const REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days

// Endpoints whose responses contain accessToken/refreshToken
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/refresh",
  "/auth/google",
  "/auth/2fa/verify",
  "/auth/login/phone",
];

interface ProxyOptions {
  method: string;
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}

export async function proxyToBackend(
  path: string,
  options: ProxyOptions,
) {
  const url = new URL(`${BACKEND_URL}${BASE_PATH}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // ── OUTBOUND: read cookies → set Authorization header ─────
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  // Strip stale Authorizations (e.g., "Bearer null" from old getAuthToken calls)
  if (headers["Authorization"] === "Bearer null" || headers["Authorization"] === "Bearer undefined") {
    delete headers["Authorization"];
  }

  if (accessToken && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const fetchOptions: RequestInit = {
    method: options.method,
    headers,
  };

  // ── Special: inject refresh_token cookie into body for /auth/refresh ──
  if (path === "/auth/refresh") {
    const refreshToken = cookieStore.get("refresh_token")?.value;
    if (refreshToken) {
      options.body = { ...(options.body as any), refreshToken };
    }
  }

  if (options.body && options.method !== "GET") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), fetchOptions);
  const data = await res.json();

  // ── INBOUND: extract tokens → set httpOnly cookies ─────────
  // Tokens stay in the response body too — the frontend uses
  // in-memory copies for UI state (isAuthenticated, etc.).
  const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => path.startsWith(ep));

  if (isAuthEndpoint && data?.data) {
    if (data.data.accessToken) {
      cookieStore.set("access_token", data.data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: ACCESS_TTL,
        path: "/",
      });
    }
    if (data.data.refreshToken) {
      cookieStore.set("refresh_token", data.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_TTL,
        path: "/",
      });
    }
  }

  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

// Extract JWT from incoming request Authorization header (for logout, etc.)
export function getAuthToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
