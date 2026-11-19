package callback

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
	"github.com/voicelink/dialer-service/internal/domain"
)

type Client interface {
	SendProgress(ctx context.Context, campaignID string, progress domain.CampaignProgress) error
	SendCompleted(ctx context.Context, campaignID string, progress domain.CampaignProgress) error
}

type CallbackClient struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
	logger     *zap.Logger
}

func NewCallbackClient(baseURL, apiKey string, logger *zap.Logger) *CallbackClient {
	return &CallbackClient{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
	}
}

type callbackPayload struct {
	CampaignID string `json:"campaignId"`
	Dialed     int    `json:"dialed"`
	Answered   int    `json:"answered"`
	Failed     int    `json:"failed"`
	Busy       int    `json:"busy"`
	NoAnswer   int    `json:"noAnswer"`
	Remaining  int    `json:"remaining"`
}

func (c *CallbackClient) SendProgress(ctx context.Context, campaignID string, progress domain.CampaignProgress) error {
	return c.send(ctx, campaignID, progress)
}

func (c *CallbackClient) SendCompleted(ctx context.Context, campaignID string, progress domain.CampaignProgress) error {
	progress.Remaining = 0
	return c.send(ctx, campaignID, progress)
}

func (c *CallbackClient) send(ctx context.Context, campaignID string, progress domain.CampaignProgress) error {
	payload := callbackPayload{
		CampaignID: campaignID,
		Dialed:     progress.Dialed,
		Answered:   progress.Answered,
		Failed:     progress.Failed,
		Busy:       progress.Busy,
		NoAnswer:   progress.NoAnswer,
		Remaining:  progress.Remaining,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/internal/dialer/callback", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		c.logger.Warn("Failed to send callback to NestJS",
			zap.String("campaignId", campaignID),
			zap.Error(err),
		)
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		c.logger.Warn("NestJS callback returned non-2xx status",
			zap.String("campaignId", campaignID),
			zap.Int("statusCode", resp.StatusCode),
		)
	}

	return nil
}
