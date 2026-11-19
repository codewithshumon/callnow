package dialer

import (
	"context"
	"testing"
	"time"
)

func TestTelnyxClient_Name(t *testing.T) {
	client := NewTelnyxClient("", "")
	if client.Name() != "telnyx" {
		t.Fatalf("expected name to be telnyx, got %s", client.Name())
	}
}

func TestTelnyxClient_SimulatedCall(t *testing.T) {
	client := NewTelnyxClient("", "")
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	result, err := client.Call(ctx, "+15551234567", "+15559876543", CallOptions{
		Timeout: 30 * time.Second,
	})
	if err != nil {
		t.Fatalf("expected no error in simulated mode, got %v", err)
	}

	if result.ProviderCallSid == "" {
		t.Fatalf("expected non-empty ProviderCallSid")
	}

	if result.DurationSeconds != 15 {
		t.Fatalf("expected 15s duration, got %d", result.DurationSeconds)
	}
}

func TestTelnyxClient_ValidateWebhookSignature(t *testing.T) {
	client := NewTelnyxClient("", "")
	if !client.ValidateWebhookSignature([]byte("payload"), "") {
		t.Fatalf("expected dev validation to return true when apiKey is empty")
	}
}
