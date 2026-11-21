import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NESTJS_API_URL || "http://localhost:4000";

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const authHeader =
      request.headers.get("authorization") ||
      (accessToken ? `Bearer ${accessToken}` : "");

    const response = await fetch(`${BACKEND_URL}/api/v1/calls/recordings/all`, {
      method: "DELETE",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete all call recordings" },
      { status: 500 },
    );
  }
}
