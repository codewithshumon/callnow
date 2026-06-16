import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  searchParams.forEach((v, k) => { params[k] = v; });
  return proxyToBackend("/contacts", {
    method: "GET",
    params,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend("/contacts", {
    method: "POST",
    body,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const body = await request.json();
  return proxyToBackend(`/contacts/${id}`, {
    method: "PUT",
    body,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  return proxyToBackend(`/contacts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
