import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const sp: Record<string, string> = {};
  searchParams.forEach((v, k) => { sp[k] = v; });
  return proxyToBackend(`/conversations/${id}/messages`, {
    method: "GET",
    params: sp,
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}
