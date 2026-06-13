"use client";

import axios, { type AxiosInstance, type AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import type { ApiResponse, PaginatedResponse } from "@/lib/types";

// ── Axios Instance ──────────────────────────────────────────

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1`;

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ── Request Interceptor — attach JWT token ──────────────────

apiClient.interceptors.request.use(
  (config) => {
    // Only in browser (not during SSR)
    if (typeof window !== "undefined") {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — handle 401 with token refresh ────

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

    // Only attempt refresh on 401 and not already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      // Don't refresh if the request was to auth endpoints
      const url = originalRequest.url || "";
      if (
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          const token = useAuthStore.getState().accessToken;
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      isRefreshing = true;
      (originalRequest as any)._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken, expiresIn } =
          response.data.data;

        useAuthStore.getState().setTokens({
          accessToken,
          refreshToken: newRefreshToken || refreshToken,
          expiresIn,
        });

        processQueue();

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Clear auth and redirect to login
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Type-safe API helpers ───────────────────────────────────

export async function get<T>(url: string, params?: Record<string, unknown>) {
  const response = await apiClient.get<ApiResponse<T>>(url, { params });
  return response.data;
}

export async function getPaginated<T>(
  url: string,
  params?: Record<string, unknown>
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
  error: unknown
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
