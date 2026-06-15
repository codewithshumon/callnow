import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders when open", () => {
    render(<ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="Delete?" description="Are you sure?" />);
    expect(screen.getByText("Delete?")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("calls onConfirm when clicking confirm", async () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open={true} onClose={vi.fn()} onConfirm={onConfirm} title="T" description="D" />);
    await userEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onClose when clicking cancel", async () => {
    const onClose = vi.fn();
    render(<ConfirmDialog open={true} onClose={onClose} onConfirm={vi.fn()} title="T" description="D" />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses destructive variant", () => {
    render(<ConfirmDialog open={true} onClose={vi.fn()} onConfirm={vi.fn()} title="T" description="D" variant="destructive" confirmLabel="Delete" />);
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});
