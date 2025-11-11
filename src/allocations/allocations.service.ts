import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';

@Injectable()
export class AllocationsService {
	constructor(private readonly prisma: PrismaService) {}

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
		return this.prisma.$transaction(async (tx) => {
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

			// Update asset status to ALLOCATED
			await tx.asset.update({
				where: { id: dto.assetId },
				data: { status: 'ALLOCATED' },
			});

			return allocation;
		});
	}

	async update(id: string, dto: UpdateAllocationDto) {
		await this.ensureExists(id);
		return this.prisma.allocation.update({
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


