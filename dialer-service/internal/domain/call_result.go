package domain

import (
	"time"
)

type CallResult struct {
	ProviderCallSid string
	ContactID       string
	Status          ContactStatus
	DurationSeconds int
	ErrorMessage    string
	Timestamp       time.Time
}
