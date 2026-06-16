import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyToBackend("/voicemails", {
    method: "GET",
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const body = await request.json();
  return proxyToBackend(`/voicemails/${id}`, {
    method: "PATCH",
    body,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
