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
      data: {
        ...createProcurementDto,
        status: 'Pending',
      },
    });
  }

  async update(id: string, updateProcurementDto: UpdateProcurementDto) {
    const currentProcurement = await this.prisma.procurementRequest.findUnique({
      where: { id },
    });
    if (!currentProcurement) {
      throw new Error('Procurement request not found');
    }

    const updatedProcurement = await this.prisma.procurementRequest.update({
      where: { id },
      data: updateProcurementDto,
    });

    // Auto-create assets if status changed to APPROVED
    if (updateProcurementDto.status === 'APPROVED' && currentProcurement.status !== 'APPROVED') {
      const quantity = updatedProcurement.quantity || 1;
      for (let i = 1; i <= quantity; i++) {
        const assetName = quantity > 1 ? `${updatedProcurement.itemName} - ${i}` : updatedProcurement.itemName;
        const asset = await this.prisma.asset.create({
          data: {
            name: assetName,
            category: updatedProcurement.category || 'Uncategorized',
            status: 'COMMISSIONED',
            vendor: updatedProcurement.vendor,
            purchaseCost: updatedProcurement.estimatedCost,
            purchaseDate: new Date(),
          },
        });

        // Create lifecycle entry for commissioning
        await this.prisma.lifecycle.create({
          data: {
            assetId: asset.id,
            stage: 'COMMISSIONED',
            performedBy: null,
            notes: `Asset created from approved procurement request ${updatedProcurement.id}`,
            location: 'Procurement Department',
          },
        });
      }
    }

    return updatedProcurement;
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

  async approveRequest(id: string, approverId: string, reason?: string) {
    const procurement = await this.prisma.procurementRequest.findUnique({
      where: { id },
    });
    if (!procurement) {
      throw new Error('Procurement request not found');
    }
    if (procurement.status !== 'Pending') {
      throw new Error('Procurement request is not in pending status');
    }

    // Update procurement
    const updatedProcurement = await this.prisma.procurementRequest.update({
      where: { id },
      data: {
        status: 'Approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        justification: reason ? `${procurement.justification || ''} Approval note: ${reason}`.trim() : procurement.justification,
      },
    });

    // Auto-create assets
    const quantity = procurement.quantity || 1;
    const assets: any[] = [];
    for (let i = 1; i <= quantity; i++) {
      const assetName = quantity > 1 ? `${procurement.itemName} - ${i}` : procurement.itemName;
      const asset = await this.prisma.asset.create({
        data: {
          name: assetName,
          category: procurement.category || 'Uncategorized',
          status: 'COMMISSIONED',
          ownerUserId: procurement.requestedBy,
          procurementRequestId: procurement.id,
          purchaseCost: procurement.estimatedCost,
          vendor: procurement.vendor,
        },
      });
      assets.push(asset);

      // Create lifecycle entry for commissioning
      await this.prisma.lifecycle.create({
        data: {
          assetId: asset.id,
          performedBy: approverId,
          stage: 'COMMISSIONED',
          notes: `Asset commissioned via approved procurement request ${procurement.id}`,
          location: 'Procurement Department',
        },
      });
    }

    return { procurement: updatedProcurement, assets };
  }

  async rejectRequest(id: string, approverId: string, reason?: string) {
    const procurement = await this.prisma.procurementRequest.findUnique({
      where: { id },
    });
    if (!procurement) {
      throw new Error('Procurement request not found');
    }
    if (procurement.status !== 'Pending') {
      throw new Error('Procurement request is not in pending status');
    }

    return this.prisma.procurementRequest.update({
      where: { id },
      data: {
        status: 'Rejected',
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
    });
  }
}
