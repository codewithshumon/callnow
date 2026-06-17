import { proxyToBackend } from "@/lib/proxy";

export async function POST() {
  return proxyToBackend("/auth/ws-token", { method: "POST", body: {} });
}
