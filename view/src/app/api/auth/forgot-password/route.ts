import { proxyToBackend } from "@/lib/proxy";

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend("/auth/forgot-password", { method: "POST", body });
}
