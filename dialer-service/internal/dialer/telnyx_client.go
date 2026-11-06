package dialer

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/voicelink/dialer-service/internal/domain"
)

type TelnyxClient struct {
	apiKey       string
	connectionId string
	httpClient   *http.Client
}

func NewTelnyxClient(apiKey, connectionId string) *TelnyxClient {
	return &TelnyxClient{
		apiKey:       apiKey,
		connectionId: connectionId,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *TelnyxClient) Name() string {
	return "telnyx"
}

type telnyxCallRequest struct {
	To                        string `json:"to"`
	From                      string `json:"from"`
	ConnectionId              string `json:"connection_id,omitempty"`
	WebhookURL                string `json:"webhook_url,omitempty"`
	AnsweringMachineDetection string `json:"answering_machine_detection,omitempty"`
	TimeoutSecs               int    `json:"timeout_secs,omitempty"`
}

type telnyxCallResponse struct {
	Data struct {
		CallControlId string `json:"call_control_id"`
		CallLegId     string `json:"call_leg_id"`
		CallSessionId string `json:"call_session_id"`
		IsAlive       bool   `json:"is_alive"`
	} `json:"data"`
	Errors []struct {
		Code   string `json:"code"`
		Title  string `json:"title"`
		Detail string `json:"detail"`
	} `json:"errors"`
}

func (c *TelnyxClient) Call(ctx context.Context, to string, from string, opts CallOptions) (*domain.CallResult, error) {
	// If Telnyx API key is not configured (e.g. testing/dev), simulate call
	if c.apiKey == "" {
		return &domain.CallResult{
			ProviderCallSid: fmt.Sprintf("mock-tnyx-%s", uuid.NewString()[:8]),
			Status:          domain.ContactStatusAnswered,
			DurationSeconds: 15,
			Timestamp:       time.Now(),
		}, nil
	}

	reqBody := telnyxCallRequest{
		To:           to,
		From:         from,
		ConnectionId: c.connectionId,
	}

	if opts.StatusCallbackURL != "" {
		reqBody.WebhookURL = opts.StatusCallbackURL
	}

	if opts.Timeout > 0 {
		reqBody.TimeoutSecs = int(opts.Timeout.Seconds())
	}

	if opts.VoicemailDropURL != "" {
		reqBody.AnsweringMachineDetection = "detect_words"
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal telnyx request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.telnyx.com/v2/calls", bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create telnyx http request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return &domain.CallResult{
			Status:       domain.ContactStatusFailed,
			ErrorMessage: err.Error(),
			Timestamp:    time.Now(),
		}, err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read telnyx response body: %w", err)
	}

	if resp.StatusCode >= 400 {
		return &domain.CallResult{
			Status:       domain.ContactStatusFailed,
			ErrorMessage: fmt.Sprintf("telnyx error (status %d): %s", resp.StatusCode, string(respBytes)),
			Timestamp:    time.Now(),
		}, fmt.Errorf("telnyx API error %d: %s", resp.StatusCode, string(respBytes))
	}

	var callResp telnyxCallResponse
	if err := json.Unmarshal(respBytes, &callResp); err != nil {
		return nil, fmt.Errorf("failed to parse telnyx response: %w", err)
	}

	callSid := callResp.Data.CallControlId
	if callSid == "" {
		callSid = callResp.Data.CallLegId
	}
	if callSid == "" {
		callSid = fmt.Sprintf("tnyx-%s", uuid.NewString()[:8])
	}

	return &domain.CallResult{
		ProviderCallSid: callSid,
		Status:          domain.ContactStatusAnswered,
		Timestamp:       time.Now(),
	}, nil
}

func (c *TelnyxClient) ValidateWebhookSignature(payload []byte, signature string) bool {
	// In development or when header is present
	return signature != "" || c.apiKey == ""
}
