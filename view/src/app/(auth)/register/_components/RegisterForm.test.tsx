import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "./RegisterForm";

vi.mock("@/store/authStore", () => ({
  useAuthStore: () => ({ register: vi.fn().mockResolvedValue(undefined) }),
}));

describe("RegisterForm", () => {
  it("renders registration fields", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/password/i)).toHaveLength(2); // password + confirm
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("shows password strength indicator", async () => {
    render(<RegisterForm />);
    const pwInput = screen.getByLabelText(/^password$/i);
    await userEvent.type(pwInput, "Weak1!");
    await waitFor(() => {
      expect(screen.getByText(/fair|good|strong/i)).toBeInTheDocument();
    });
  });

  it("shows error when passwords don't match", async () => {
    render(<RegisterForm />);
    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "StrongPass1!");
    await userEvent.type(screen.getByLabelText(/confirm/i), "Different1!");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/don't match/i)).toBeInTheDocument();
    });
  });
});
