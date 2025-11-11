import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceService {
	constructor(private readonly prisma: PrismaService) {}

	private includeRelations() {
		return {
			asset: { select: { id: true, name: true, serialNumber: true } },
			reportedBy: { select: { id: true, name: true, email: true } },
			assignedTo: { select: { id: true, name: true, email: true } },
		};
	}

	async list(params: { page?: number; pageSize?: number }) {
		const page = Math.max(1, params.page ?? 1);
		const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
		const [items, total] = await this.prisma.$transaction([
			this.prisma.maintenance.findMany({
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * pageSize,
				take: pageSize,
				include: this.includeRelations(),
			}),
			this.prisma.maintenance.count(),
		]);
		return { items, page, pageSize, total };
	}

	async create(dto: CreateMaintenanceDto) {
		return this.prisma.$transaction(async (tx) => {
			// Create the maintenance record
			const maintenance = await tx.maintenance.create({
			data: {
				assetId: dto.assetId,
				type: dto.type as any,
				priority: dto.priority as any,
				vendor: dto.vendor,
				estimatedCost: dto.estimatedCost,
				actualCost: dto.actualCost,
				scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
				dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
				notes: dto.notes,
				reportedById: dto.reportedById,
				assignedToId: dto.assignedToId,
			},
				include: this.includeRelations(),
			});

			// Update asset status to MAINTENANCE
			await tx.asset.update({
				where: { id: dto.assetId },
				data: { status: 'MAINTENANCE' },
			});

			return maintenance;
		});
	}

	async update(id: string, dto: UpdateMaintenanceDto) {
		await this.ensureExists(id);
		
		return this.prisma.$transaction(async (tx) => {
			// Get current maintenance record to check status change
			const currentMaintenance = await tx.maintenance.findUnique({
				where: { id },
				select: { assetId: true, status: true },
			});

			// Update the maintenance record
			const maintenance = await tx.maintenance.update({
				where: { id },
			data: {
				type: dto.type as any,
				priority: dto.priority as any,
				status: dto.status as any,
				vendor: dto.vendor,
				estimatedCost: dto.estimatedCost,
				actualCost: dto.actualCost,
				scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
				dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
				notes: dto.notes,
				reportedById: dto.reportedById,
				assignedToId: dto.assignedToId,
			},
				include: this.includeRelations(),
			});

			// If status changed to "COMPLETED", update asset back to IN_OPERATION
			if (dto.status === 'COMPLETED' && currentMaintenance && currentMaintenance.status !== 'COMPLETED') {
				await tx.asset.update({
					where: { id: currentMaintenance.assetId },
					data: { status: 'IN_OPERATION' },
				});
			}

			return maintenance;
		});
	}

	private async ensureExists(id: string) {
		const exists = await this.prisma.maintenance.findUnique({ where: { id }, select: { id: true } });
		if (!exists) throw new NotFoundException('Maintenance record not found');
	}
}


