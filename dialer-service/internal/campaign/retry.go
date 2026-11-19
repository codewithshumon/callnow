package campaign

import (
	"github.com/voicelink/dialer-service/internal/domain"
)

func ShouldRetry(contact *domain.CampaignContact, campaign *domain.Campaign) bool {
	if campaign.RetryMax <= 0 {
		return false
	}

	// Retry only no-answer and busy per FR-PD-13
	if contact.Status != domain.ContactStatusNoAnswer && contact.Status != domain.ContactStatusBusy {
		return false
	}

	return contact.Attempts < campaign.RetryMax+1
}
