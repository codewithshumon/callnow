package domain

import "errors"

var (
	ErrCampaignNotFound         = errors.New("campaign not found")
	ErrInvalidStatusTransition  = errors.New("invalid status transition")
	ErrContactNotFound          = errors.New("contact not found")
	ErrQueueEmpty               = errors.New("queue is empty")
	ErrProviderFailure          = errors.New("telephony provider failure")
	ErrDNCSkip                  = errors.New("number is on do-not-call list")
	ErrOutsideCallingHours      = errors.New("outside allowed calling hours")
	ErrCampaignAlreadyCompleted = errors.New("campaign already completed")
	ErrCampaignStopped          = errors.New("campaign has been stopped")
)
