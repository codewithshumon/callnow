package campaign

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParseCSV_Valid(t *testing.T) {
	csvData := `name,phone,notes
Alice,+14155551234,VIP lead
Bob,+14155559876,Follow-up`

	rows, report, err := ParseCSV(strings.NewReader(csvData))
	assert.NoError(t, err)
	assert.Equal(t, 2, report.Total)
	assert.Equal(t, 2, report.Valid)
	assert.Equal(t, 0, report.Invalid)
	assert.Len(t, rows, 2)
	assert.Equal(t, "+14155551234", rows[0].Phone)
	assert.Equal(t, "Alice", rows[0].Name)
}

func TestParseCSV_MissingPhoneColumn(t *testing.T) {
	csvData := `name,email
Alice,alice@example.com`

	_, _, err := ParseCSV(strings.NewReader(csvData))
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "missing required phone column")
}

func TestParseCSV_InvalidNumbers(t *testing.T) {
	csvData := `phone,name
+14155551234,Good Number
invalid-number,Bad Number`

	rows, report, err := ParseCSV(strings.NewReader(csvData))
	assert.NoError(t, err)
	assert.Equal(t, 2, report.Total)
	assert.Equal(t, 1, report.Valid)
	assert.Equal(t, 1, report.Invalid)
	assert.Len(t, rows, 1)
	assert.Equal(t, "+14155551234", rows[0].Phone)
}
