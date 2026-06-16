import { proxyToBackend } from "@/lib/proxy";

export async function POST(request: Request) {
  const body = await request.json();
  return proxyToBackend("/auth/login", { method: "POST", body });
}
