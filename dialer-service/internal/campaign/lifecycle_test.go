package campaign

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/voicelink/dialer-service/internal/domain"
)

func TestValidateTransition(t *testing.T) {
	tests := []struct {
		current domain.CampaignStatus
		next    domain.CampaignStatus
		wantErr bool
	}{
		{domain.CampaignStatusDraft, domain.CampaignStatusRunning, false},
		{domain.CampaignStatusDraft, domain.CampaignStatusPaused, true},
		{domain.CampaignStatusDraft, domain.CampaignStatusCompleted, true},
		{domain.CampaignStatusRunning, domain.CampaignStatusPaused, false},
		{domain.CampaignStatusRunning, domain.CampaignStatusCompleted, false},
		{domain.CampaignStatusRunning, domain.CampaignStatusStopped, false},
		{domain.CampaignStatusPaused, domain.CampaignStatusRunning, false},
		{domain.CampaignStatusPaused, domain.CampaignStatusStopped, false},
		{domain.CampaignStatusPaused, domain.CampaignStatusCompleted, true},
		{domain.CampaignStatusCompleted, domain.CampaignStatusRunning, true},
		{domain.CampaignStatusStopped, domain.CampaignStatusRunning, true},
		{domain.CampaignStatusRunning, domain.CampaignStatusRunning, false},
	}

	for _, tt := range tests {
		err := ValidateTransition(tt.current, tt.next)
		if tt.wantErr {
			assert.Error(t, err)
		} else {
			assert.NoError(t, err)
		}
	}
}
