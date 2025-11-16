import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisposalDto } from './dto/create-disposal.dto';
import { UpdateDisposalDto } from './dto/update-disposal.dto';

@Injectable()
export class DisposalsService {
	constructor(private readonly prisma: PrismaService) {}

	private includeRelations() {
		return {
			asset: { select: { id: true, name: true, serialNumber: true } },
			requestedBy: { select: { id: true, name: true, email: true } },
		};
	}

	list() {
		return this.prisma.disposal.findMany({
			orderBy: { createdAt: 'desc' },
			include: this.includeRelations(),
		});
	}

	async getDisposalStats() {
		const totalDisposals = await this.prisma.disposal.count();

		const disposalsByStatusRaw = await this.prisma.disposal.groupBy({
			by: ['status'],
			_count: { status: true },
		});

		// Transform to match expected format
		const disposalsByStatus = disposalsByStatusRaw.map(item => ({
			status: item.status,
			_count: item._count.status,
		}));

		return {
			totalDisposals,
			disposalsByStatus,
		};
	}

	async get(id: string) {
		const item = await this.prisma.disposal.findUnique({
			where: { id },
			include: this.includeRelations(),
		});
		if (!item) throw new NotFoundException('Disposal not found');
		return item;
	}

	create(dto: CreateDisposalDto, userId: string) {
		return this.prisma.$transaction(async (tx) => {
			// Create the disposal request
			const disposal = await tx.disposal.create({
				data: {
					assetId: dto.assetId,
					requestedById: userId,
					reason: dto.reason,
					description: dto.description,
					method: dto.method,
					estimatedValue: dto.estimatedValue,
					salvageValue: dto.salvageValue,
					status: dto.status as any,
				},
				include: this.includeRelations(),
			});

			// Update asset status to DISPOSAL
			await tx.asset.update({
				where: { id: dto.assetId },
				data: { status: 'DISPOSAL' },
			});

			return disposal;
		});
	}

	async update(id: string, dto: UpdateDisposalDto) {
		await this.ensureExists(id);
		return this.prisma.disposal.update({
			where: { id },
			data: {
				status: dto.status as any,
				method: dto.method,
				estimatedValue: dto.estimatedValue,
				salvageValue: dto.salvageValue,
			},
			include: this.includeRelations(),
		});
	}

	private async ensureExists(id: string) {
		const exists = await this.prisma.disposal.findUnique({ where: { id }, select: { id: true } });
		if (!exists) throw new NotFoundException('Disposal not found');
	}
}


