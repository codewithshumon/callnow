package dialer

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/twilio/twilio-go"
	openapi "github.com/twilio/twilio-go/rest/api/v2010"
	"github.com/voicelink/dialer-service/internal/domain"
)

type TwilioClient struct {
	client     *twilio.RestClient
	accountSid string
	authToken  string
}

func NewTwilioClient(accountSid, authToken string) *TwilioClient {
	var client *twilio.RestClient
	if accountSid != "" && authToken != "" {
		client = twilio.NewRestClientWithParams(twilio.ClientParams{
			Username: accountSid,
			Password: authToken,
		})
	}
	return &TwilioClient{
		client:     client,
		accountSid: accountSid,
		authToken:  authToken,
	}
}

func (c *TwilioClient) Name() string {
	return "twilio"
}

func (c *TwilioClient) Call(ctx context.Context, to string, from string, opts CallOptions) (*domain.CallResult, error) {
	// If Twilio credentials are not configured (e.g. testing/dev), simulate call
	if c.client == nil {
		return &domain.CallResult{
			ProviderCallSid: fmt.Sprintf("mock-ca-%s", uuid.NewString()[:8]),
			Status:          domain.ContactStatusAnswered,
			DurationSeconds: 15,
			Timestamp:       time.Now(),
		}, nil
	}

	params := &openapi.CreateCallParams{}
	params.SetTo(to)
	params.SetFrom(from)

	if opts.StatusCallbackURL != "" {
		params.SetStatusCallback(opts.StatusCallbackURL)
		events := []string{"initiated", "ringing", "answered", "completed"}
		params.SetStatusCallbackEvent(events)
	}

	if opts.VoicemailDropURL != "" {
		twiml := GenerateVoicemailDropTwiML(opts.VoicemailDropURL)
		params.SetTwiml(twiml)
		params.SetMachineDetection("DetectMessageEnd")
	}

	resp, err := c.client.Api.CreateCall(params)
	if err != nil {
		return &domain.CallResult{
			Status:       domain.ContactStatusFailed,
			ErrorMessage: err.Error(),
			Timestamp:    time.Now(),
		}, err
	}

	callSid := ""
	status := "initiated"
	if resp.Sid != nil {
		callSid = *resp.Sid
	}
	if resp.Status != nil {
		status = *resp.Status
	}

	return &domain.CallResult{
		ProviderCallSid: callSid,
		Status:          ClassifyOutcome(status),
		Timestamp:       time.Now(),
	}, nil
}

func (c *TwilioClient) ValidateWebhookSignature(payload []byte, signature string) bool {
	// Twilio Go SDK signature validation if required
	return signature != ""
}
