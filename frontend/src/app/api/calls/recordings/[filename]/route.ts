import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NESTJS_API_URL || "http://localhost:4000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const res = await fetch(
    `${BACKEND_URL}/api/v1/calls/recordings/${encodeURIComponent(filename)}`,
  );
  if (!res.ok) {
    return new NextResponse("Recording not found", { status: 404 });
  }
  const blob = await res.blob();
  return new NextResponse(blob, {
    headers: {
      "Content-Type": "audio/webm",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
