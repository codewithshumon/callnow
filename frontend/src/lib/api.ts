"use client";

import axios, { type AxiosInstance, type AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import type { ApiResponse, PaginatedResponse } from "@/lib/types";

// ── Axios Instance ──────────────────────────────────────────

// All API calls go through Next.js route handlers (/api/*).
// proxy.ts reads the access_token cookie and sets the Authorization header.
// No manual Authorization header management needed.

const BASE_URL = "/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Response Interceptor — handle 401 with token refresh ────
// The refresh_token cookie is sent automatically; proxy.ts forwards it.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(undefined);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      const url = originalRequest.url || "";
      // Don't refresh if already calling auth endpoints
      if (
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      isRefreshing = true;
      (originalRequest as any)._retry = true;

      try {
        // refresh_token cookie is sent automatically
        await axios.post(`${BASE_URL}/auth/refresh`, {});

        // Update in-memory tokens if returned
        const store = useAuthStore.getState();
        // Try to read updated user from a quick profile call, or just update tokens
        processQueue();
        return apiClient(originalRequest);
      } catch {
        processQueue(new Error("Refresh failed"));
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(new Error("Session expired"));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Type-safe API helpers ───────────────────────────────────

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data;
}

export async function getPaginated<T>(
  url: string,
  params?: Record<string, unknown>,
) {
  const response = await apiClient.get<PaginatedResponse<T>>(url, { params });
  return response.data;
}

export async function post<T>(url: string, data?: unknown) {
  const response = await apiClient.post<ApiResponse<T>>(url, data);
  return response.data;
}

export async function postForm<T>(url: string, formData: FormData) {
  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function put<T>(url: string, data?: unknown) {
  const response = await apiClient.put<ApiResponse<T>>(url, data);
  return response.data;
}

export async function patch<T>(url: string, data?: unknown) {
  const response = await apiClient.patch<ApiResponse<T>>(url, data);
  return response.data;
}

export async function del<T>(url: string) {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data;
}

// ── API Error Extractor ─────────────────────────────────────

export function extractApiError(
  error: unknown,
): { code: string; message: string; field?: string } {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error instanceof Error) {
    return { code: "UNKNOWN", message: error.message };
  }
  return {
    code: "UNKNOWN",
    message: "An unexpected error occurred. Please try again.",
  };
}
