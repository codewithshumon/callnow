import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { parse } from 'csv-parse/sync';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  // 7.1.2 — List contacts with search/filter
  async listContacts(
    userId: string,
    search?: string,
    tag?: string,
    page = 1,
    limit = 50,
  ) {
    const where: Record<string, unknown> = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        {
          phones: {
            some: { number: { contains: search } },
          },
        },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: { phones: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  // 7.1.3 — Create contact
  async createContact(userId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email,
        notes: dto.notes,
        tags: dto.tags || [],
        phones: dto.phones
          ? {
              create: dto.phones.map((p) => ({
                number: p.number,
                label: p.label || 'mobile',
              })),
            }
          : undefined,
      },
      include: { phones: true },
    });
  }

  // 7.1.4 — Update contact
  async updateContact(
    userId: string,
    contactId: string,
    dto: UpdateContactDto,
  ) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, userId },
    });
    if (!contact) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Contact not found' });

    // Sync phones: delete old, create new
    if (dto.phones !== undefined) {
      await this.prisma.contactPhone.deleteMany({
        where: { contactId },
      });
    }

    return this.prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.phones !== undefined && {
          phones: {
            create: dto.phones.map((p) => ({
              number: p.number,
              label: p.label || 'mobile',
            })),
          },
        }),
      },
      include: { phones: true },
    });
  }

  // 7.1.5 — Delete contact
  async deleteContact(userId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, userId },
    });
    if (!contact) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Contact not found' });

    await this.prisma.contact.delete({ where: { id: contactId } });
    return { message: 'Contact deleted' };
  }

  // 7.1.6 — Import contacts from CSV
  async importContacts(userId: string, csvBuffer: Buffer) {
    const csvString = csvBuffer.toString('utf-8');
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let imported = 0;
    let skipped = 0;

    for (const rawRow of records) {
      const row = rawRow as Record<string, string>;
      const phone = row.phone || row.phonenumber || row.number || row.mobile;
      if (!phone) {
        skipped++;
        continue;
      }

      await this.prisma.contact.create({
        data: {
          userId,
          name: row.name || 'Unknown',
          email: row.email || null,
          notes: row.notes || null,
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          phones: {
            create: [{ number: phone, label: row.label || 'mobile' }],
          },
        },
      });
      imported++;
    }

    return { imported, skipped, total: records.length };
  }

  // 7.1.7 — Match a phone number to a contact
  async matchContact(fromNumber: string, userId: string) {
    const phone = await this.prisma.contactPhone.findFirst({
      where: {
        number: fromNumber,
        contact: { userId },
      },
      include: { contact: { select: { name: true } } },
    });

    return phone?.contact?.name || null;
  }
}
