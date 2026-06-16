import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend("/messages", {
    method: "POST",
    body,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
