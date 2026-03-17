import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';

@Injectable()
export class MaintenanceService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notificationsService: NotificationsService,
	) {}

	private includeRelations() {
		return {
			asset: { select: { id: true, name: true, serialNumber: true } },
			reportedBy: { select: { id: true, name: true, email: true } },
			assignedTo: { select: { id: true, name: true, email: true } },
		};
	}

	async list(params: { page?: number; pageSize?: number }, user?: { userId: string; role: string }) {
		const page = Math.max(1, params.page ?? 1);
		const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
		const where: any = {};
		if (user?.role === 'USER') {
			where.reportedById = user.userId;
		}
		const [items, total] = await this.prisma.$transaction([
			this.prisma.maintenance.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip: (page - 1) * pageSize,
				take: pageSize,
				include: this.includeRelations(),
			}),
			this.prisma.maintenance.count({ where }),
		]);
		return { items, page, pageSize, total };
	}

	async create(dto: CreateMaintenanceDto, user: { userId: string; role: string }) {
		// Ensure enums are uppercase
		dto.type = dto.type.toUpperCase();
		dto.priority = dto.priority.toUpperCase();

		// Validate asset ownership for USER role
		if (user.role === 'USER') {
			const asset = await this.prisma.asset.findUnique({
				where: { id: dto.assetId },
				select: { assignedToId: true },
			});
			if (!asset || asset.assignedToId !== user.userId) {
				throw new Error('You can only create maintenance requests for your assigned assets');
			}
		}

		// Fetch asset details for notification
		const asset = await this.prisma.asset.findUnique({
			where: { id: dto.assetId },
			select: { id: true, name: true },
		});

		if (!asset) {
			throw new NotFoundException('Asset not found');
		}

		const maintenance = await this.prisma.$transaction(async (tx) => {
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
				reportedById: user.userId,
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

		// Send notification to all ADMIN users
		try {
			await this.notificationsService.sendNotificationToRole('ADMIN', {
				title: 'New Maintenance Request',
				message: `A maintenance request of type ${dto.type} has been submitted for ${asset.name} with priority ${dto.priority}.`,
				type: 'MAINTENANCE_REQUEST',
			});
		} catch (error) {
			console.error('Failed to send maintenance notification:', error);
			// Don't throw, as the maintenance request was created successfully
		}

		return maintenance;
	}

	async update(id: string, dto: UpdateMaintenanceDto) {
		await this.ensureExists(id);

		if (dto.type) dto.type = dto.type.toUpperCase();
		if (dto.priority) dto.priority = dto.priority.toUpperCase();
		if (dto.status) dto.status = dto.status.toUpperCase();
		
		// Get current maintenance record before updating
		const currentMaintenance = await this.prisma.maintenance.findUnique({
			where: { id },
			select: { assetId: true, status: true, reportedById: true },
		});

		const maintenance = await this.prisma.$transaction(async (tx) => {
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

		// Send notification when status changes to IN_PROGRESS (maintenance approved/started)
		if (dto.status === 'IN_PROGRESS' && currentMaintenance && currentMaintenance.status !== 'IN_PROGRESS') {
			try {
				const asset = await this.prisma.asset.findUnique({
					where: { id: currentMaintenance.assetId },
					select: { name: true },
				});

				if (asset && currentMaintenance.reportedById) {
					await this.notificationsService.sendNotificationToUser(currentMaintenance.reportedById, {
						title: 'Maintenance Request Approved',
						message: `Your maintenance request for ${asset.name} has been approved and work has started.`,
						type: 'MAINTENANCE_APPROVED',
					});
				}
			} catch (error) {
				console.error('Failed to send maintenance approval notification:', error);
				// Don't throw, as the update was successful
			}
		}

		// Send notification to the user who reported the maintenance when completed
		if (dto.status === 'COMPLETED' && currentMaintenance && currentMaintenance.status !== 'COMPLETED') {
			try {
				const asset = await this.prisma.asset.findUnique({
					where: { id: currentMaintenance.assetId },
					select: { name: true },
				});

				if (asset && currentMaintenance.reportedById) {
					await this.notificationsService.sendNotificationToUser(currentMaintenance.reportedById, {
						title: 'Maintenance Completed',
						message: `Your maintenance request for ${asset.name} has been completed.`,
						type: 'MAINTENANCE_COMPLETED',
					});
				}
			} catch (error) {
				console.error('Failed to send maintenance completion notification:', error);
				// Don't throw, as the update was successful
			}
		}

		return maintenance;
	}

	private async ensureExists(id: string) {
		const exists = await this.prisma.maintenance.findUnique({ where: { id }, select: { id: true } });
		if (!exists) throw new NotFoundException('Maintenance record not found');
	}
}


