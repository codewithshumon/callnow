import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function POST(request: Request) {
  return proxyToBackend("/calls/token", {
    method: "POST",
    body: {},
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
