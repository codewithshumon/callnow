import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {}
  return proxyToBackend("/auth/logout", {
    method: "POST",
    body,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
