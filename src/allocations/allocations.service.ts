import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';

@Injectable()
export class AllocationsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notificationsService: NotificationsService,
	) {}

	private includeRelations() {
		return {
			asset: { select: { id: true, name: true, serialNumber: true } },
			assignedTo: { select: { id: true, name: true, email: true } },
			assignedBy: { select: { id: true, name: true, email: true } },
		};
	}

	async list() {
		return this.prisma.allocation.findMany({
			orderBy: { createdAt: 'desc' },
			include: this.includeRelations(),
		});
	}

	async get(id: string) {
		const item = await this.prisma.allocation.findUnique({
			where: { id },
			include: this.includeRelations(),
		});
		if (!item) throw new NotFoundException('Allocation not found');
		return item;
	}

	async create(dto: CreateAllocationDto) {
		// Check if asset exists and is in COMMISSIONED status
		const asset = await this.prisma.asset.findUnique({
			where: { id: dto.assetId },
			select: { id: true, status: true, name: true },
		});
		if (!asset) {
			throw new NotFoundException('Asset not found');
		}
		if (asset.status !== 'COMMISSIONED') {
			throw new Error('Asset must be in COMMISSIONED status to be allocated');
		}

		// Fetch assigned user details for notification
		const assignedUser = await this.prisma.user.findUnique({
			where: { id: dto.assignedToId },
			select: { id: true, name: true },
		});

		const allocation = await this.prisma.$transaction(async (tx) => {
			// Create the allocation
			const allocation = await tx.allocation.create({
				data: {
					assetId: dto.assetId,
					assignedToId: dto.assignedToId,
					assignedById: dto.assignedById,
					department: dto.department,
					startDate: dto.startDate ? new Date(dto.startDate) : undefined,
					expectedReturn: dto.expectedReturn ? new Date(dto.expectedReturn) : undefined,
					status: dto.status ?? 'Active',
					notes: dto.notes,
				},
				include: this.includeRelations(),
			});

			// Update asset status to ALLOCATED and set permanent owner
			await tx.asset.update({
				where: { id: dto.assetId },
				data: {
					assignedToId: dto.assignedToId,
					status: 'ALLOCATED'
				}
			});

			return allocation;
		});

		// Send notification to the user who received the asset allocation (after transaction)
		if (assignedUser) {
			try {
				await this.notificationsService.sendNotificationToUser(assignedUser.id, {
					title: 'Asset Allocated to You',
					message: `You have been allocated a ${asset.name}. Department: ${dto.department}. ${dto.notes ? `Notes: ${dto.notes}` : ''}`,
					type: 'ASSET_ALLOCATED',
				});
			} catch (error) {
				console.error('Failed to send allocation notification:', error);
				// Don't throw, as the allocation was created successfully
			}
		}

		return allocation;
	}

	async update(id: string, dto: UpdateAllocationDto) {
		await this.ensureExists(id);
		
		// Get the current allocation to check if assignedToId changed
		const currentAllocation = await this.prisma.allocation.findUnique({
			where: { id },
			select: { assetId: true, assignedToId: true }
		});
		
		const updatedAllocation = await this.prisma.allocation.update({
			where: { id },
			data: {
				assignedToId: dto.assignedToId,
				department: dto.department,
				startDate: dto.startDate ? new Date(dto.startDate) : undefined,
				expectedReturn: dto.expectedReturn ? new Date(dto.expectedReturn) : undefined,
				status: dto.status,
				notes: dto.notes,
			},
			include: this.includeRelations(),
		});
		
		// If assignedToId changed, update the asset and send notification
		if (dto.assignedToId && dto.assignedToId !== currentAllocation?.assignedToId) {
			await this.prisma.asset.update({
				where: { id: updatedAllocation.assetId },
				data: {
					assignedToId: dto.assignedToId,
					status: 'ALLOCATED'
				}
			});

			// Send notification to the newly assigned user
			try {
				const asset = await this.prisma.asset.findUnique({
					where: { id: currentAllocation?.assetId },
					select: { name: true },
				});

				const newAssignedUser = await this.prisma.user.findUnique({
					where: { id: dto.assignedToId },
					select: { id: true, name: true },
				});

				if (asset && newAssignedUser) {
					await this.notificationsService.sendNotificationToUser(newAssignedUser.id, {
						title: 'Asset Reassigned to You',
						message: `You have been reassigned a ${asset.name}. Department: ${dto.department}. ${dto.notes ? `Notes: ${dto.notes}` : ''}`,
						type: 'ASSET_REASSIGNED',
					});
				}
			} catch (error) {
				console.error('Failed to send reassignment notification:', error);
				// Don't throw, as the update was successful
			}
		}
		
		return updatedAllocation;
	}

	async checkIn(id: string) {
		await this.ensureExists(id);
		return this.prisma.allocation.update({
			where: { id },
			data: { status: 'Returned', expectedReturn: new Date() },
			include: this.includeRelations(),
		});
	}

	async checkOut(id: string) {
		await this.ensureExists(id);
		return this.prisma.allocation.update({
			where: { id },
			data: { status: 'Active', startDate: new Date() },
			include: this.includeRelations(),
		});
	}

	async transferLog() {
		// Derive transfers from lifecycle stage TRANSFER, newest first
		return this.prisma.lifecycle.findMany({
			where: { stage: 'TRANSFER' as any },
			orderBy: { createdAt: 'desc' },
			take: 100,
		});
	}

	private async ensureExists(id: string) {
		const exists = await this.prisma.allocation.findUnique({ where: { id }, select: { id: true } });
		if (!exists) throw new NotFoundException('Allocation not found');
	}
}


