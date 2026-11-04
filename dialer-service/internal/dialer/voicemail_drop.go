package dialer

import "fmt"

func GenerateVoicemailDropTwiML(audioURL string) string {
	return fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>%s</Play>
    <Hangup/>
</Response>`, audioURL)
}
