import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NESTJS_API_URL || "http://localhost:4000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const authHeader =
      request.headers.get("authorization") ||
      (accessToken ? `Bearer ${accessToken}` : "");

    const formData = await request.formData();

    const response = await fetch(`${BACKEND_URL}/api/v1/calls/${id}/recording`, {
      method: "POST",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to upload recording" },
      { status: 500 },
    );
  }
}
