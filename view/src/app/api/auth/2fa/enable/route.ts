import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyToBackend("/auth/2fa/enable", {
    method: "POST",
    body: {},
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
