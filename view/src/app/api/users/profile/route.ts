import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function PUT(request: Request) {
  const body = await request.json();
  return proxyToBackend("/users/profile", {
    method: "PUT",
    body,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
