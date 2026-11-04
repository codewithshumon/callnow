package campaign

import (
	"fmt"
	"github.com/voicelink/dialer-service/internal/domain"
)

func ValidateTransition(current, next domain.CampaignStatus) error {
	if current == next {
		return nil
	}

	valid := false
	switch current {
	case domain.CampaignStatusDraft:
		valid = (next == domain.CampaignStatusRunning)
	case domain.CampaignStatusRunning:
		valid = (next == domain.CampaignStatusPaused ||
			next == domain.CampaignStatusCompleted ||
			next == domain.CampaignStatusStopped)
	case domain.CampaignStatusPaused:
		valid = (next == domain.CampaignStatusRunning ||
			next == domain.CampaignStatusStopped)
	case domain.CampaignStatusCompleted, domain.CampaignStatusStopped:
		valid = false
	default:
		valid = false
	}

	if !valid {
		return fmt.Errorf("%w: cannot transition from %s to %s",
			domain.ErrInvalidStatusTransition, current, next)
	}

	return nil
}
