package dialer

import (
	"context"
	"errors"

	"github.com/voicelink/dialer-service/internal/domain"
)

var ErrNotImplemented = errors.New("provider not implemented yet")

type StubProvider struct {
	providerName string
}

func NewStubProvider(name string) *StubProvider {
	return &StubProvider{providerName: name}
}

func (s *StubProvider) Name() string {
	return s.providerName
}

func (s *StubProvider) Call(ctx context.Context, to string, from string, opts CallOptions) (*domain.CallResult, error) {
	return nil, ErrNotImplemented
}

func (s *StubProvider) ValidateWebhookSignature(payload []byte, signature string) bool {
	return false
}
