import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyToBackend("/api-keys", {
    method: "GET",
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend("/api-keys", {
    method: "POST",
    body,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  return proxyToBackend(`/api-keys/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
