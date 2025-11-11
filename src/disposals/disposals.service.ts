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
			approvedBy: { select: { id: true, name: true, email: true } },
		};
	}

	list() {
		return this.prisma.disposalRequest.findMany({
			orderBy: { createdAt: 'desc' },
			include: this.includeRelations(),
		});
	}

	async get(id: string) {
		const item = await this.prisma.disposalRequest.findUnique({
			where: { id },
			include: this.includeRelations(),
		});
		if (!item) throw new NotFoundException('Disposal request not found');
		return item;
	}

	create(dto: CreateDisposalDto) {
		return this.prisma.$transaction(async (tx) => {
			// Create the disposal request
			const disposal = await tx.disposalRequest.create({
				data: {
					assetId: dto.assetId,
					method: dto.method,
					reason: dto.reason,
					estimatedValue: dto.estimatedValue,
					salvageValue: dto.salvageValue,
					approvedById: dto.approvedById,
					disposedDate: dto.disposedDate ? new Date(dto.disposedDate) : undefined,
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
		return this.prisma.disposalRequest.update({
			where: { id },
			data: {
				method: dto.method,
				reason: dto.reason,
				estimatedValue: dto.estimatedValue,
				salvageValue: dto.salvageValue,
				approvedById: dto.approvedById,
				disposedDate: dto.disposedDate ? new Date(dto.disposedDate) : undefined,
				status: dto.status as any,
			},
			include: this.includeRelations(),
		});
	}

	private async ensureExists(id: string) {
		const exists = await this.prisma.disposalRequest.findUnique({ where: { id }, select: { id: true } });
		if (!exists) throw new NotFoundException('Disposal request not found');
	}
}


