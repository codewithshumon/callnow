import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.messageTemplate.create({
      data: {
        userId,
        name: dto.name,
        body: dto.body,
        variables: dto.variables || [],
      },
    });
  }

  async list(userId: string) {
    return this.prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async update(userId: string, templateId: string, dto: UpdateTemplateDto) {
    const tmpl = await this.prisma.messageTemplate.findFirst({
      where: { id: templateId, userId },
    });
    if (!tmpl) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Template not found' });

    return this.prisma.messageTemplate.update({
      where: { id: templateId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.variables !== undefined && { variables: dto.variables }),
      },
    });
  }

  async delete(userId: string, templateId: string) {
    const tmpl = await this.prisma.messageTemplate.findFirst({
      where: { id: templateId, userId },
    });
    if (!tmpl) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Template not found' });
    await this.prisma.messageTemplate.delete({ where: { id: templateId } });
    return { message: 'Template deleted' };
  }

  // 10.1.3 — Variable interpolation
  interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] ?? match;
    });
  }
}
