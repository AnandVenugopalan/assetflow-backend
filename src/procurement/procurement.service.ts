import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcurementRequestDto } from './dto/create-enterprise-procurement.dto';
import { ProcurementReviewDto, FinanceApprovalDto } from './dto/workflow.dto';
import { ProcurementStatus } from '@prisma/client';

@Injectable()
export class ProcurementService {
  constructor(private readonly prisma: PrismaService) {}

  private async createAuditLog(action: string, entityId: string, userId: string, oldValue: any, newValue: any) {
    await this.prisma.systemAuditLog.create({
      data: {
        action,
        entityType: 'ProcurementRequest',
        entityId,
        userId,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.procurementRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { requestedByUser: { select: { id: true, name: true, email: true } }, vendor: true },
    });
  }

  async findMyRequests(userId: string) {
    return this.prisma.procurementRequest.findMany({
      where: { requestedByUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: { vendor: true },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.procurementRequest.findUnique({
      where: { id },
      include: { vendor: true, purchaseOrders: true, requestedByUser: { select: { id: true, name: true, email: true } } },
    });
    if (!request) throw new NotFoundException('Procurement Request not found');
    return request;
  }

  async submitDraft(id: string, userId: string) {
    const request = await this.findOne(id);
    if (request.status !== ProcurementStatus.DRAFT) {
      throw new BadRequestException('Only drafts can be submitted');
    }

    const updated = await this.prisma.procurementRequest.update({
      where: { id },
      data: { status: ProcurementStatus.SUBMITTED },
    });
    await this.createAuditLog('REQUEST_SUBMITTED', id, userId, request, updated);
    return updated;
  }

  // Step 1: Department User creates Request
  async create(dto: CreateProcurementRequestDto, userId: string) {
    const request = await this.prisma.procurementRequest.create({
      data: {
        ...dto,
        requestedByUserId: userId,
        status: (dto.status as ProcurementStatus) || ProcurementStatus.DRAFT,
        requiredDate: dto.requiredDate ? new Date(dto.requiredDate) : null,
      },
    });

    await this.createAuditLog(dto.status === 'SUBMITTED' ? 'REQUEST_SUBMITTED' : 'REQUEST_DRAFTED', request.id, userId, null, request);
    return request;
  }

  // Step 2: Procurement Review
  async procurementReview(id: string, dto: ProcurementReviewDto, userId: string) {
    const request = await this.findOne(id);

    let nextStatus: ProcurementStatus = ProcurementStatus.UNDER_REVIEW;
    if (dto.action === 'FORWARD_TO_FINANCE') nextStatus = ProcurementStatus.PENDING_FINANCE_APPROVAL;
    else if (dto.action === 'REJECT') nextStatus = ProcurementStatus.REJECTED;
    else if (dto.action === 'REQUEST_CLARIFICATION') nextStatus = ProcurementStatus.CLARIFICATION_REQUESTED;

    const updated = await this.prisma.procurementRequest.update({
      where: { id },
      data: {
        vendorId: dto.vendorId,
        estimatedCost: dto.estimatedCost,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
        procurementNotes: dto.procurementNotes,
        status: nextStatus,
        ...(dto.action === 'REJECT' ? { rejectionReason: dto.procurementNotes } : {}),
      },
    });

    await this.createAuditLog(`PROCUREMENT_REVIEW_${dto.action}`, id, userId, request, updated);
    return updated;
  }

  // Step 3: Finance Approval
  async financeApproval(id: string, dto: FinanceApprovalDto, userId: string) {
    const request = await this.findOne(id);

    let nextStatus: ProcurementStatus = ProcurementStatus.PENDING_FINANCE_APPROVAL;
    if (dto.action === 'APPROVE') nextStatus = ProcurementStatus.FINANCE_APPROVED;
    else if (dto.action === 'REJECT') nextStatus = ProcurementStatus.FINANCE_REJECTED;
    else if (dto.action === 'SEND_BACK') nextStatus = ProcurementStatus.UNDER_REVIEW;

    const updated = await this.prisma.procurementRequest.update({
      where: { id },
      data: {
        approvedAmount: dto.approvedAmount,
        financeRemarks: dto.financeRemarks,
        status: nextStatus,
        ...(dto.action === 'APPROVE' ? { approvedBy: userId, approvedAt: new Date() } : {}),
      },
    });

    await this.createAuditLog(`FINANCE_${dto.action}`, id, userId, request, updated);
    return updated;
  }

  async submitClarification(id: string, updateDto: any, userId: string) {
    const request = await this.findOne(id);
    if (request.status !== ProcurementStatus.CLARIFICATION_REQUESTED) {
      throw new BadRequestException('Request is not pending clarification');
    }

    const updatedNotes = request.procurementNotes 
      ? request.procurementNotes + '\n\n[User Response]: ' + updateDto.clarificationResponse 
      : '[User Response]: ' + updateDto.clarificationResponse;

    const updated = await this.prisma.procurementRequest.update({
      where: { id },
      data: {
        procurementNotes: updatedNotes,
        status: ProcurementStatus.UNDER_REVIEW,
      },
    });

    await this.createAuditLog('CLARIFICATION_SUBMITTED', id, userId, request, updated);
    return updated;
  }

  async uploadDocument(id: string, key: 'quotationFile' | 'technicalEvalFile', filename: string) {
    return this.prisma.procurementRequest.update({
      where: { id },
      data: { [key]: filename },
    });
  }

  async getDashboardStats() {
    const total = await this.prisma.procurementRequest.count();
    const pendingReview = await this.prisma.procurementRequest.count({ where: { status: ProcurementStatus.UNDER_REVIEW } });
    const pendingFinance = await this.prisma.procurementRequest.count({ where: { status: ProcurementStatus.PENDING_FINANCE_APPROVAL } });
    const approved = await this.prisma.procurementRequest.count({ where: { status: ProcurementStatus.FINANCE_APPROVED } });
    const rejected = await this.prisma.procurementRequest.count({ where: { status: { in: [ProcurementStatus.REJECTED, ProcurementStatus.FINANCE_REJECTED] } } });
    const poGenerated = await this.prisma.procurementRequest.count({ where: { status: ProcurementStatus.PO_GENERATED } });
    const received = await this.prisma.procurementRequest.count({ where: { status: ProcurementStatus.RECEIVED } });

    return { total, pendingReview, pendingFinance, approved, rejected, poGenerated, received };
  }
}
