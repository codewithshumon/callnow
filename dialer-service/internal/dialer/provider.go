package dialer

import (
	"context"
	"time"

	"github.com/voicelink/dialer-service/internal/domain"
)

type CallOptions struct {
	Timeout            time.Duration
	Record             bool
	RecordDisclosure   bool
	VoicemailDropURL   string
	StatusCallbackURL  string
}

type TelephonyProvider interface {
	Name() string
	Call(ctx context.Context, to string, from string, opts CallOptions) (*domain.CallResult, error)
	ValidateWebhookSignature(payload []byte, signature string) bool
}
