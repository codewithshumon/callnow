import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";

// Mock the router
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// Mock auth store
vi.mock("@/store/authStore", () => ({
  useAuthStore: () => ({ login: vi.fn().mockResolvedValue(undefined) }),
}));

describe("LoginForm", () => {
  it("renders email and password inputs", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("shows validation error for empty fields", async () => {
    render(<LoginForm />);
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    await waitFor(() => {
      expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it("calls login on valid submit", async () => {
    render(<LoginForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));
    // No error messages should appear
    await waitFor(() => {
      expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
    });
  });
});
