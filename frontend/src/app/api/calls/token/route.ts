import { proxyToBackend } from "@/lib/proxy";

export async function GET() {
  return proxyToBackend("/calls/token", { method: "GET" });
}

export async function POST() {
  return proxyToBackend("/calls/token", { method: "POST", body: {} });
}
