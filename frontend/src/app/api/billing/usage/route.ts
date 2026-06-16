import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyToBackend("/billing/usage", {
    method: "GET",
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
