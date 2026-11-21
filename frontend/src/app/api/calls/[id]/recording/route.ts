import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NESTJS_API_URL || "http://localhost:4000";

export const dynamic = "force-dynamic";
export const maxDuration = 120; // 2 minutes for uploading long audio recordings

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    let accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;
    let authHeader =
      request.headers.get("authorization") ||
      (accessToken ? `Bearer ${accessToken}` : "");

    // Parse the form data
    const formData = await request.formData();

    // Helper to send upload to backend
    const sendUpload = async (tokenHeader?: string) => {
      // Re-create a fresh FormData to ensure fresh boundary & stream
      const uploadBody = new FormData();
      for (const [key, value] of formData.entries()) {
        uploadBody.append(key, value);
      }
      return fetch(`${BACKEND_URL}/api/v1/calls/${id}/recording`, {
        method: "POST",
        headers: {
          ...(tokenHeader ? { Authorization: tokenHeader } : {}),
        },
        body: uploadBody,
      });
    };

    let response = await sendUpload(authHeader);

    // If 401 Unauthorized (e.g. 15-min token expired during a long conversation), refresh token and retry
    let newAccessToken = "";
    let newRefreshToken = "";
    if (response.status === 401 && refreshToken) {
      try {
        const refreshRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData?.data?.accessToken) {
          newAccessToken = refreshData.data.accessToken;
          newRefreshToken = refreshData.data.refreshToken || refreshToken;
          authHeader = `Bearer ${newAccessToken}`;
          // Retry the recording upload with fresh access token
          response = await sendUpload(authHeader);
        }
      } catch (refreshErr) {
        console.warn("[Recording Upload] Token auto-refresh failed:", refreshErr);
      }
    }

    const data = await response.json().catch(() => ({}));
    const nextRes = NextResponse.json(data, { status: response.status });

    // Persist refreshed cookies if renewed
    if (newAccessToken) {
      const isSecure = process.env.NODE_ENV === "production";
      nextRes.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        maxAge: 15 * 60,
        path: "/",
      });
      if (newRefreshToken) {
        nextRes.cookies.set("refresh_token", newRefreshToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: isSecure,
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });
      }
    }

    return nextRes;
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to upload recording" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const response = await fetch(`${BACKEND_URL}/api/v1/calls/${id}/recording`, {
      method: "DELETE",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete recording" },
      { status: 500 },
    );
  }
}
