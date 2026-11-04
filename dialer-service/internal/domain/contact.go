package domain

import (
	"time"
)

type ContactStatus string

const (
	ContactStatusPending  ContactStatus = "pending"
	ContactStatusDialing  ContactStatus = "dialing"
	ContactStatusAnswered ContactStatus = "answered"
	ContactStatusNoAnswer ContactStatus = "no-answer"
	ContactStatusBusy     ContactStatus = "busy"
	ContactStatusFailed   ContactStatus = "failed"
	ContactStatusDNC      ContactStatus = "dnc"
)

type CampaignContact struct {
	ID              string        `json:"id"`
	CampaignID      string        `json:"campaignId"`
	Phone           string        `json:"phone"`
	Name            *string       `json:"name,omitempty"`
	Notes           *string       `json:"notes,omitempty"`
	Status          ContactStatus `json:"status"`
	Attempts        int           `json:"attempts"`
	CallDuration    *int          `json:"callDuration,omitempty"`
	LastAttemptedAt *time.Time    `json:"lastAttemptedAt,omitempty"`
	CreatedAt       time.Time     `json:"createdAt"`
}
