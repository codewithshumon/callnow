import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';

export interface CsvValidationReport {
  total: number;
  valid: number;
  invalid: Array<{ row: number; reason: string }>;
  dncSkipped: number;
}

@Injectable()
export class CsvValidator {
  private readonly logger = new Logger(CsvValidator.name);

  // 8.2 — Pre-upload CSV validation
  validate(
    csvBuffer: Buffer,
    dncPhones: Set<string> = new Set(),
  ): CsvValidationReport {
    const csvString = csvBuffer.toString('utf-8');
    let records: Record<string, string>[];

    try {
      records = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Invalid CSV format',
      });
    }

    if (records.length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'CSV file is empty',
      });
    }

    if (records.length > 100_000) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'CSV exceeds maximum of 100,000 contacts',
      });
    }

    // Detect phone column
    const header = Object.keys(records[0]);
    const phoneCol = header.find(
      (h) =>
        ['phone', 'phonenumber', 'number', 'mobile', 'tel'].includes(
          h.toLowerCase(),
        ),
    );

    if (!phoneCol) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'No phone column found. Expected: phone, phonenumber, number, mobile, or tel',
      });
    }

    const e164Regex = /^\+[1-9]\d{1,14}$/;
    const report: CsvValidationReport = {
      total: records.length,
      valid: 0,
      invalid: [],
      dncSkipped: 0,
    };

    for (let i = 0; i < records.length; i++) {
      const phone = records[i][phoneCol]?.trim() || '';
      const rowNum = i + 2; // +2 for header + 1-based

      if (!phone) {
        report.invalid.push({ row: rowNum, reason: 'Phone number is empty' });
        continue;
      }

      if (!e164Regex.test(phone)) {
        report.invalid.push({
          row: rowNum,
          reason: `Invalid E.164 format: ${phone}`,
        });
        continue;
      }

      if (dncPhones.has(phone)) {
        report.dncSkipped++;
        continue;
      }

      report.valid++;
    }

    if (report.valid === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'No valid phone numbers found in CSV',
      });
    }

    return report;
  }
}
