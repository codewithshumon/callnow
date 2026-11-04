package dto

import (
	"time"

	"github.com/voicelink/dialer-service/internal/campaign"
)

type CreateCampaignRequest struct {
	ID                   string                   `json:"id"`
	Name                 string                   `json:"name"`
	UserID               string                   `json:"userId"`
	FromNumber           string                   `json:"fromNumber"`
	Concurrency          int                      `json:"concurrency"`
	DelaySeconds         int                      `json:"delaySeconds"`
	RetryMax             int                      `json:"retryMax"`
	VoicemailDropURL     *string                  `json:"voicemailDropUrl,omitempty"`
	CallingHoursStart    *string                  `json:"callingHoursStart,omitempty"`
	CallingHoursEnd      *string                  `json:"callingHoursEnd,omitempty"`
	CallingHoursTimezone *string                  `json:"callingHoursTimezone,omitempty"`
	ScheduledAt          *time.Time               `json:"scheduledAt,omitempty"`
	Contacts             []campaign.ContactCSVRow `json:"contacts"`
}
