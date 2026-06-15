import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageSquare } from "lucide-react";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState icon={MessageSquare} title="No items" description="Nothing to show here." />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Nothing to show here.")).toBeInTheDocument();
  });

  it("renders action button when provided", async () => {
    const onClick = vi.fn();
    render(<EmptyState title="Empty" description="desc" action={{ label: "Add", onClick }} />);
    const btn = screen.getByText("Add");
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not render action button when not provided", () => {
    render(<EmptyState title="Empty" description="desc" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
