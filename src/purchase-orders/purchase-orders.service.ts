import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { CreatePoDto, UpdatePoDto } from './dto/po.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService
  ) {}

  private async generatePoNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.purchaseOrder.count({
      where: { poNumber: { startsWith: `PO-${year}-` } },
    });
    return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(createPoDto: CreatePoDto) {
    const poNumber = await this.generatePoNumber();
    
    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        date: new Date(),
        vendorId: createPoDto.vendorId,
        procurementRequestId: createPoDto.procurementRequestId,
        approvedAmount: createPoDto.approvedAmount,
        paymentTerms: createPoDto.paymentTerms,
        expectedDelivery: createPoDto.expectedDelivery ? new Date(createPoDto.expectedDelivery) : null,
        status: 'GENERATED',
      },
    });

    // Update procurement request status to PO_GENERATED
    await this.prisma.procurementRequest.update({
      where: { id: createPoDto.procurementRequestId },
      data: { status: 'PO_GENERATED' },
    });

    return po;
  }

  async findAll() {
    return this.prisma.purchaseOrder.findMany({
      include: { vendor: true, procurementRequest: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { vendor: true, procurementRequest: true },
    });
    if (!po) throw new NotFoundException('PO not found');
    return po;
  }

  async update(id: string, updatePoDto: UpdatePoDto) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: updatePoDto,
    });
  }

  async markAsOrdered(id: string) {
    const po = await this.update(id, { status: 'ORDERED' });
    
    await this.prisma.procurementRequest.update({
      where: { id: po.procurementRequestId },
      data: { status: 'ORDERED' },
    });

    return po;
  }

  async markAsCompleted(id: string) {
    const po = await this.update(id, { status: 'COMPLETED' });
    
    const request = await this.prisma.procurementRequest.findUnique({
      where: { id: po.procurementRequestId },
      include: { vendor: true }
    });

    if (!request) throw new NotFoundException('Procurement Request not found');

    await this.prisma.procurementRequest.update({
      where: { id: request.id },
      data: { status: 'COMPLETED' },
    });

    // Auto-generate Assets based on quantity
    const quantity = request.quantity || 1;
    const vendorName = request.vendor?.name || 'Unknown Vendor';
    const costPerItem = request.approvedAmount ? request.approvedAmount / quantity : 0;

    for (let i = 1; i <= quantity; i++) {
        await this.assetsService.create({
            name: `${request.itemName} - ${i}`,
            category: request.category || 'general',
            status: 'COMMISSIONED', // Asset is ready
            vendor: vendorName,
            purchaseDate: po.date.toISOString(),
            purchaseCost: costPerItem,
            department: request.department,
            procurementRequestId: request.id,
            description: request.justification,
        });
    }

    return po;
  }
}
