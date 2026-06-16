import { proxyToBackend, getAuthToken } from "@/lib/proxy";

export async function GET(request: Request) {
  return proxyToBackend("/campaigns", {
    method: "GET",
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const res = await fetch(`${process.env.NESTJS_API_URL || "http://localhost:4000"}/api/v1/campaigns`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAuthToken(request)}` },
    body: formData,
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
