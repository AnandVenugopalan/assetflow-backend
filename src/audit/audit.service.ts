import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditDto } from './dto/create-audit.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  private includeRelations() {
    return {
      asset: { select: { id: true, name: true, serialNumber: true } },
      auditor: { select: { id: true, name: true, email: true } },
    };
  }

  async list() {
    return this.prisma.audit.findMany({
      orderBy: { auditedAt: 'desc' },
      include: this.includeRelations(),
    });
  }

  async get(id: string) {
    const item = await this.prisma.audit.findUnique({
      where: { id },
      include: this.includeRelations(),
    });
    if (!item) throw new NotFoundException('Audit record not found');
    return item;
  }

  async create(dto: CreateAuditDto, auditedBy?: string) {
    return this.prisma.audit.create({
      data: {
        assetId: dto.assetId,
        condition: dto.condition as any,
        verificationStatus: dto.verificationStatus as any,
        remarks: dto.remarks,
        auditedBy,
      },
      include: this.includeRelations(),
    });
  }

  async getByAsset(assetId: string) {
    return this.prisma.audit.findMany({
      where: { assetId },
      orderBy: { auditedAt: 'desc' },
      include: this.includeRelations(),
    });
  }
}
