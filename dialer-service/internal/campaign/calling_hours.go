package campaign

import (
	"fmt"
	"time"

	"github.com/voicelink/dialer-service/internal/domain"
)

func IsWithinCallingHours(c *domain.Campaign, now time.Time) bool {
	if c.CallingHoursStart == nil || c.CallingHoursEnd == nil || *c.CallingHoursStart == "" || *c.CallingHoursEnd == "" {
		return true // No calling hours constraint
	}

	tz := "UTC"
	if c.CallingHoursTimezone != nil && *c.CallingHoursTimezone != "" {
		tz = *c.CallingHoursTimezone
	}

	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.UTC
	}

	localNow := now.In(loc)
	currentMinutes := localNow.Hour()*60 + localNow.Minute()

	var startH, startM, endH, endM int
	if _, err := fmt.Sscanf(*c.CallingHoursStart, "%d:%d", &startH, &startM); err != nil {
		return true
	}
	if _, err := fmt.Sscanf(*c.CallingHoursEnd, "%d:%d", &endH, &endM); err != nil {
		return true
	}

	startMinutes := startH*60 + startM
	endMinutes := endH*60 + endM

	return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}
