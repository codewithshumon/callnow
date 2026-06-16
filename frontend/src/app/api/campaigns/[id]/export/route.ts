import { getAuthToken } from "@/lib/proxy";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${process.env.NESTJS_API_URL || "http://localhost:4000"}/api/v1/campaigns/${id}/export`, {
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
  const blob = await res.blob();
  return new Response(blob, {
    status: res.status,
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="campaign-${id}.csv"` },
  });
}
