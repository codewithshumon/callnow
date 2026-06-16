import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyToBackend(`/campaigns/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const action = body?.action || "start";
  return proxyToBackend(`/campaigns/${id}/${action}`, {
    method: "POST",
    body: {},
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
