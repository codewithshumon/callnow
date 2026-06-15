"use client";

import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithPhone = useAuthStore((s) => s.loginWithPhone);
  const logout = useAuthStore((s) => s.logout);

  return {
    user,
    isAuthenticated: !!accessToken,
    isLoading,
    login,
    register,
    loginWithGoogle,
    loginWithPhone,
    logout,
  };
}
