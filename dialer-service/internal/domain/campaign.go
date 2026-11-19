package domain

import (
	"time"
)

type CampaignStatus string

const (
	CampaignStatusDraft     CampaignStatus = "draft"
	CampaignStatusRunning   CampaignStatus = "running"
	CampaignStatusPaused    CampaignStatus = "paused"
	CampaignStatusCompleted CampaignStatus = "completed"
	CampaignStatusStopped   CampaignStatus = "stopped"
)

type Campaign struct {
	ID                   string         `json:"id"`
	UserID               string         `json:"userId"`
	Name                 string         `json:"name"`
	Status               CampaignStatus `json:"status"`
	FromNumber           string         `json:"fromNumber"`
	Concurrency          int            `json:"concurrency"`
	DelaySeconds         int            `json:"delaySeconds"`
	RetryMax             int            `json:"retryMax"`
	VoicemailDropURL     *string        `json:"voicemailDropUrl,omitempty"`
	CallingHoursStart    *string        `json:"callingHoursStart,omitempty"`
	CallingHoursEnd      *string        `json:"callingHoursEnd,omitempty"`
	CallingHoursTimezone *string        `json:"callingHoursTimezone,omitempty"`
	TotalContacts        int            `json:"totalContacts"`
	Dialed               int            `json:"dialed"`
	Answered             int            `json:"answered"`
	Failed               int            `json:"failed"`
	Busy                 int            `json:"busy"`
	NoAnswer             int            `json:"noAnswer"`
	ScheduledAt          *time.Time     `json:"scheduledAt,omitempty"`
	StartedAt            *time.Time     `json:"startedAt,omitempty"`
	PausedAt             *time.Time     `json:"pausedAt,omitempty"`
	CompletedAt          *time.Time     `json:"completedAt,omitempty"`
	CreatedAt            time.Time      `json:"createdAt"`
}

type CampaignProgress struct {
	Dialed    int `json:"dialed"`
	Answered  int `json:"answered"`
	Failed    int `json:"failed"`
	Busy      int `json:"busy"`
	NoAnswer  int `json:"noAnswer"`
	Remaining int `json:"remaining"`
}
