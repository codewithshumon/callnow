import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NESTJS_API_URL || "http://localhost:4000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;
    const range = request.headers.get("range");

    const headers: Record<string, string> = {};
    if (range) {
      headers["range"] = range;
    }

    const res = await fetch(
      `${BACKEND_URL}/api/v1/calls/recordings/${encodeURIComponent(filename)}`,
      { headers },
    );

    if (!res.ok) {
      return new NextResponse("Recording not found", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "audio/webm";
    const contentLength = res.headers.get("content-length");
    const contentRange = res.headers.get("content-range");
    const acceptRanges = res.headers.get("accept-ranges") || "bytes";

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": acceptRanges,
      "Cache-Control": "public, max-age=86400",
    };
    if (contentLength) responseHeaders["Content-Length"] = contentLength;
    if (contentRange) responseHeaders["Content-Range"] = contentRange;

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new NextResponse(error?.message || "Failed to fetch recording", {
      status: 500,
    });
  }
}
