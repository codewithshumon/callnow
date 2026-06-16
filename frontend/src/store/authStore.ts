"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens } from "@/lib/types";
import { post, extractApiError } from "@/lib/api";

interface AuthState {
  // ── State ──────────────────────────────────────────────
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  // ── Core actions ───────────────────────────────────────
  setAuth: (user: User, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // ── API-calling convenience actions ────────────────────
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithPhone: (phone: string, code: string) => Promise<void>;
  refreshSession: () => Promise<void>;

  // ── Computed ───────────────────────────────────────────
  isAuthenticated: () => boolean;
  hasVerifiedEmail: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,

      // ── Core actions ─────────────────────────────────────

      setAuth: (user, tokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isLoading: false,
        }),

      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      // ── API-calling actions ──────────────────────────────

      /** Login with email + password. Stores tokens on success. */
      login: async (email, password) => {
        const res = await post<{ user: User } & AuthTokens>("/auth/login", {
          email,
          password,
        });
        get().setAuth(res.data.user, {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          expiresIn: res.data.expiresIn,
        });
      },

      /** Register new account. Does NOT auto-login (email verification required). */
      register: async (email, password) => {
        await post("/auth/register", { email, password });
        // Registration success — user must verify email before logging in
      },

      /** Login via Google OAuth ID token. */
      loginWithGoogle: async (idToken) => {
        const res = await post<{ user: User } & AuthTokens>("/auth/google", {
          idToken,
        });
        get().setAuth(res.data.user, {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          expiresIn: res.data.expiresIn,
        });
      },

      /** Verify phone OTP and login. Call POST /auth/login/phone with action=verify. */
      loginWithPhone: async (phone, code) => {
        const res = await post<{ user: User } & AuthTokens>(
          "/auth/login/phone",
          { phone, code, action: "verify" }
        );
        get().setAuth(res.data.user, {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          expiresIn: res.data.expiresIn,
        });
      },

      /** Attempt to refresh the access token using the stored refresh token. */
      refreshSession: async () => {
        const currentRefresh = get().refreshToken;
        if (!currentRefresh) {
          throw new Error("No refresh token available");
        }
        const res = await post<AuthTokens>("/auth/refresh", {
          refreshToken: currentRefresh,
        });
        get().setTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken || currentRefresh,
          expiresIn: res.data.expiresIn,
        });
      },

      // ── Computed ─────────────────────────────────────────

      isAuthenticated: () => !!get().accessToken,
      hasVerifiedEmail: () => get().user?.emailVerified ?? false,
    }),
    {
      name: "voicelink-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
