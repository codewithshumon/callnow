import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { params[k] = v; });
  return proxyToBackend("/conversations", {
    method: "GET",
    params,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
