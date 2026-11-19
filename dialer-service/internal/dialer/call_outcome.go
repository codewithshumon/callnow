package dialer

import (
	"strings"

	"github.com/voicelink/dialer-service/internal/domain"
)

func ClassifyOutcome(status string) domain.ContactStatus {
	switch strings.ToLower(status) {
	case "completed", "answered", "in-progress":
		return domain.ContactStatusAnswered
	case "no-answer":
		return domain.ContactStatusNoAnswer
	case "busy":
		return domain.ContactStatusBusy
	case "failed", "canceled":
		return domain.ContactStatusFailed
	default:
		return domain.ContactStatusFailed
	}
}
