package campaign

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strings"
)

var e164Regex = regexp.MustCompile(`^\+[1-9]\d{1,14}$`)

type ContactCSVRow struct {
	Phone string `json:"phone"`
	Name  string `json:"name"`
	Notes string `json:"notes"`
}

type InvalidRow struct {
	Row    int    `json:"row"`
	Phone  string `json:"phone"`
	Reason string `json:"reason"`
}

type ValidationReport struct {
	Total       int          `json:"total"`
	Valid       int          `json:"valid"`
	Invalid     int          `json:"invalid"`
	InvalidRows []InvalidRow `json:"invalidRows"`
}

func ParseCSV(r io.Reader) ([]ContactCSVRow, *ValidationReport, error) {
	reader := csv.NewReader(r)
	reader.TrimLeadingSpace = true

	headers, err := reader.Read()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read CSV headers: %w", err)
	}

	phoneCol := -1
	nameCol := -1
	notesCol := -1

	for i, h := range headers {
		clean := strings.ToLower(strings.TrimSpace(h))
		switch clean {
		case "phone", "phonenumber", "number", "mobile", "tel":
			phoneCol = i
		case "name", "fullname", "contact_name":
			nameCol = i
		case "notes", "note", "comment":
			notesCol = i
		}
	}

	if phoneCol == -1 {
		return nil, nil, errors.New("missing required phone column (expected 'phone', 'number', 'mobile', or 'tel')")
	}

	var validRows []ContactCSVRow
	report := &ValidationReport{
		InvalidRows: make([]InvalidRow, 0),
	}

	rowIndex := 1
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, nil, fmt.Errorf("CSV parsing error at row %d: %w", rowIndex, err)
		}
		rowIndex++
		report.Total++

		if report.Total > 100000 {
			return nil, nil, errors.New("CSV exceeds maximum allowed rows (100,000)")
		}

		if len(record) <= phoneCol {
			report.Invalid++
			report.InvalidRows = append(report.InvalidRows, InvalidRow{
				Row:    rowIndex,
				Phone:  "",
				Reason: "Missing phone column value",
			})
			continue
		}

		rawPhone := strings.TrimSpace(record[phoneCol])
		// Auto-prepend + if missing but numeric
		if !strings.HasPrefix(rawPhone, "+") && len(rawPhone) >= 10 {
			rawPhone = "+" + rawPhone
		}

		if !e164Regex.MatchString(rawPhone) {
			report.Invalid++
			report.InvalidRows = append(report.InvalidRows, InvalidRow{
				Row:    rowIndex,
				Phone:  rawPhone,
				Reason: "Invalid E.164 phone number format",
			})
			continue
		}

		row := ContactCSVRow{
			Phone: rawPhone,
		}
		if nameCol != -1 && len(record) > nameCol {
			row.Name = strings.TrimSpace(record[nameCol])
		}
		if notesCol != -1 && len(record) > notesCol {
			row.Notes = strings.TrimSpace(record[notesCol])
		}

		validRows = append(validRows, row)
		report.Valid++
	}

	if report.Valid == 0 {
		return nil, report, errors.New("CSV contains 0 valid phone numbers")
	}

	return validRows, report, nil
}
