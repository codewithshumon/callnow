import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders active status with green color", () => {
    render(<StatusBadge status="active" />);
    const badge = screen.getByText("active");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("green");
  });

  it("renders failed status with red color", () => {
    render(<StatusBadge status="failed" />);
    const badge = screen.getByText("failed");
    expect(badge.className).toContain("red");
  });

  it("renders pending status with yellow color", () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText("pending");
    expect(badge.className).toContain("yellow");
  });

  it("falls back to muted for unknown status", () => {
    render(<StatusBadge status="unknown_status" />);
    const badge = screen.getByText("unknown_status");
    expect(badge.className).toContain("muted");
  });
});
