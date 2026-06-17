"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens } from "@/lib/types";
import { post } from "@/lib/api";

interface AuthState {
  // ── State ──────────────────────────────────────────────
  // tokens are in-memory only (source of truth = httpOnly cookies).
  // user is persisted for UI so the dashboard renders on refresh.
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

  // ── API-calling actions ────────────────────────────────
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
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,

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
      // Tokens are returned by the backend and intercepted by proxy.ts,
      // which sets httpOnly cookies. We keep an in-memory copy for UI checks
      // (e.g., isAuthenticated()).

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

      register: async (email, password) => {
        await post("/auth/register", { email, password });
      },

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

      loginWithPhone: async (phone, code) => {
        const res = await post<{ user: User } & AuthTokens>(
          "/auth/login/phone",
          { phone, code, action: "verify" },
        );
        get().setAuth(res.data.user, {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          expiresIn: res.data.expiresIn,
        });
      },

      refreshSession: async () => {
        // refresh_token cookie is sent automatically; proxy forwards it.
        const res = await post<{ user: User } & AuthTokens>("/auth/refresh", {});
        get().setTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          expiresIn: res.data.expiresIn,
        });
        if (res.data.user) {
          get().setUser(res.data.user);
        }
      },

      // ── Computed ─────────────────────────────────────────
      isAuthenticated: () => !!get().accessToken,
      hasVerifiedEmail: () => get().user?.emailVerified ?? false,
    }),
    {
      name: "voicelink-auth",
      partialize: (state) => ({
        user: state.user, // only persist user for UI; tokens live in cookies
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (!error) {
            // After rehydration, check if we need to refresh
            useAuthStore.setState({ isLoading: false });
          }
        };
      },
    },
  ),
);
