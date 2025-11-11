import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcurementDto } from './dto/create-procurement.dto';
import { UpdateProcurementDto } from './dto/update-procurement.dto';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.procurementRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.procurementRequest.findUnique({
      where: { id },
    });
  }

  async create(createProcurementDto: CreateProcurementDto) {
    return this.prisma.procurementRequest.create({
      data: createProcurementDto,
    });
  }

  async update(id: string, updateProcurementDto: UpdateProcurementDto) {
    return this.prisma.procurementRequest.update({
      where: { id },
      data: updateProcurementDto,
    });
  }

  async uploadQuotation(id: string, filename: string) {
    return this.prisma.procurementRequest.update({
      where: { id },
      data: { quotationFile: filename },
    });
  }

  async getVendors() {
    const vendors = await this.prisma.procurementRequest.findMany({
      where: { vendor: { not: null } },
      select: { vendor: true },
      distinct: ['vendor'],
    });
    return vendors.map((v) => v.vendor).filter(Boolean);
  }

  async getWorkflowStats() {
    const total = await this.prisma.procurementRequest.count();
    const pending = await this.prisma.procurementRequest.count({
      where: { status: 'Pending' },
    });
    const approved = await this.prisma.procurementRequest.count({
      where: { status: 'Approved' },
    });
    const ordered = await this.prisma.procurementRequest.count({
      where: { status: 'Ordered' },
    });
    const received = await this.prisma.procurementRequest.count({
      where: { status: 'Received' },
    });

    return { total, pending, approved, ordered, received };
  }
}
