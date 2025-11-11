import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LifecycleDto } from './dto/lifecycle.dto';

@Injectable()
export class LifecycleService {
	constructor(private readonly prisma: PrismaService) {}

	create(dto: LifecycleDto, performedBy?: string) {
		return this.prisma.$transaction(async (tx) => {
			// Create the lifecycle entry
			const lifecycle = await tx.lifecycle.create({
				data: {
					assetId: dto.assetId,
					stage: dto.stage as any,
					notes: dto.notes,
					performedBy: performedBy ?? null,
				},
			});

			// Update asset status based on lifecycle stage
			let newStatus: string | null = null;
			switch (dto.stage) {
				case 'IN_OPERATION':
					newStatus = 'IN_OPERATION';
					break;
				case 'COMMISSIONED':
					newStatus = 'COMMISSIONED';
					break;
				// Add other stages as needed
			}

			if (newStatus) {
				await tx.asset.update({
					where: { id: dto.assetId },
					data: { status: newStatus as any },
				});
			}

			return lifecycle;
		});
	}

	listByAsset(assetId: string) {
		return this.prisma.lifecycle.findMany({
			where: { assetId },
			orderBy: { createdAt: 'desc' },
		});
	}

	list(params: { assetId?: string; stage?: string }) {
		const where: any = {};
		if (params.assetId) where.assetId = params.assetId;
		if (params.stage) where.stage = params.stage as any;
		return this.prisma.lifecycle.findMany({
			where,
			orderBy: { createdAt: 'desc' },
		});
	}

	async update(id: string, data: Partial<{ notes: string; scheduledDate?: string; vendor?: string; estimatedCost?: number; actualCost?: number; location?: string; priority?: string; condition?: string }>) {
		const existing = await this.prisma.lifecycle.findUnique({ where: { id }, select: { id: true } });
		if (!existing) throw new NotFoundException('Lifecycle entry not found');
		return this.prisma.lifecycle.update({
			where: { id },
			data: {
				notes: data.notes,
				scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
				vendor: data.vendor,
				estimatedCost: data.estimatedCost,
				actualCost: data.actualCost,
				location: data.location,
				priority: data.priority,
				condition: data.condition,
			},
		});
	}
}


