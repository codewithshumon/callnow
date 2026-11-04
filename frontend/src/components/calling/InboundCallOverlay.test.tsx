import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InboundCallOverlay from "./InboundCallOverlay";
import { useCallStore } from "@/store/callStore";

describe("InboundCallOverlay", () => {
  beforeEach(() => {
    useCallStore.setState({
      incomingCall: null,
      isCallOverlayOpen: false,
      activeCall: null,
    });
  });

  it("does not render when closed", () => {
    render(<InboundCallOverlay />);
    expect(screen.queryByText(/Incoming Call/i)).not.toBeInTheDocument();
  });

  it("renders when incoming call is present and overlay is open", () => {
    useCallStore.setState({
      incomingCall: { callSid: "CA123", from: "+14155551234", to: "+14155559999" },
      isCallOverlayOpen: true,
    });

    render(<InboundCallOverlay />);
    expect(screen.getByText(/Incoming Call/i)).toBeInTheDocument();
    expect(screen.getByText("+14155551234")).toBeInTheDocument();
  });

  it("calls acceptCall when accept button is clicked", () => {
    const acceptSpy = vi.fn();
    useCallStore.setState({
      incomingCall: { callSid: "CA123", from: "+14155551234", to: "+14155559999" },
      isCallOverlayOpen: true,
      acceptCall: acceptSpy,
    });

    render(<InboundCallOverlay />);
    const acceptBtn = screen.getByLabelText("Accept");
    fireEvent.click(acceptBtn);
    expect(acceptSpy).toHaveBeenCalled();
  });

  it("calls declineCall when decline button is clicked", () => {
    const declineSpy = vi.fn();
    useCallStore.setState({
      incomingCall: { callSid: "CA123", from: "+14155551234", to: "+14155559999" },
      isCallOverlayOpen: true,
      declineCall: declineSpy,
    });

    render(<InboundCallOverlay />);
    const declineBtn = screen.getByLabelText("Decline");
    fireEvent.click(declineBtn);
    expect(declineSpy).toHaveBeenCalled();
  });
});
