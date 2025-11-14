import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
	constructor(private readonly prisma: PrismaService) {}

	create(dto: CreateAssetDto) {
		return this.prisma.asset.create({
			data: {
				...dto,
				status: dto.status as any,
			},
		});
	}

	findAll(params?: { status?: string; type?: string; q?: string; assignedTo?: string }, user?: { userId: string; role: string }) {
		const where: any = {};
		
		// Handle assignedTo filter
		if (params?.assignedTo) {
			// If assignedTo query param exists, filter by it
			where.assignedToId = params.assignedTo;
		} else if (user?.role === 'USER') {
			// USER role: automatically enforce assignedToId = request.user.id when no explicit filter
			where.assignedToId = user.userId;
		}
		
		// Apply other filters for ADMIN/MANAGER or when assignedTo filter is provided
		if (params?.status && (user?.role !== 'USER' || params?.assignedTo)) {
			where.status = params.status as any;
		}
		if (params?.type && (user?.role !== 'USER' || params?.assignedTo)) {
			// UI uses "type" which maps to our optional Asset.type field or category
			where.OR = [
				{ type: { equals: params.type, mode: 'insensitive' } },
				{ category: { equals: params.type, mode: 'insensitive' } },
			];
		}
		if (params?.q && (user?.role !== 'USER' || params?.assignedTo)) {
			const q = params.q;
			where.AND = [
				{
					OR: [
						{ name: { contains: q, mode: 'insensitive' } },
						{ serialNumber: { contains: q, mode: 'insensitive' } },
						{ category: { contains: q, mode: 'insensitive' } },
						{ location: { contains: q, mode: 'insensitive' } },
					],
				},
			];
		}
		
		return this.prisma.asset.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			include: { 
				owner: { select: { id: true, name: true, email: true } },
				assignedTo: { select: { id: true, name: true, email: true } }
			},
		});
	}

	async findOne(id: string, user?: { userId: string; role: string }) {
		const asset = await this.prisma.asset.findUnique({
			where: { id },
			include: { 
				owner: { select: { id: true, name: true, email: true } },
				assignedTo: { select: { id: true, name: true, email: true } }
			},
		});
		if (!asset) throw new NotFoundException('Asset not found');
		
		// Role-based access control
		if (user?.role === 'USER' && asset.assignedToId !== user.userId) {
			throw new NotFoundException('Asset not found');
		}
		
		return asset;
	}

	async update(id: string, dto: UpdateAssetDto) {
		await this.ensureExists(id);
		return this.prisma.asset.update({
			where: { id },
			data: {
				...dto,
				status: dto.status as any,
			},
		});
	}

	async remove(id: string) {
		await this.ensureExists(id);
		await this.prisma.asset.delete({ where: { id } });
		return { success: true };
	}

	async addDocument(assetId: string, file: { originalname: string; mimetype: string; path: string; }) {
		await this.ensureExists(assetId);
		return this.prisma.assetDocument.create({
			data: {
				assetId,
				fileName: file.originalname,
				fileType: file.mimetype,
				fileUrl: file.path.replace(/\\/g, '/'),
			},
		});
	}

	async listDocuments(assetId: string) {
		await this.ensureExists(assetId);
		return this.prisma.assetDocument.findMany({
			where: { assetId },
			orderBy: { uploadedAt: 'desc' },
		});
	}

	async deleteDocument(assetId: string, docId: string) {
		await this.ensureExists(assetId);
		const doc = await this.prisma.assetDocument.findUnique({ where: { id: docId } });
		if (!doc || doc.assetId !== assetId) throw new NotFoundException('Document not found');
		await this.prisma.assetDocument.delete({ where: { id: docId } });
		return { success: true };
	}

	private async ensureExists(id: string) {
		const exists = await this.prisma.asset.findUnique({ where: { id }, select: { id: true } });
		if (!exists) throw new NotFoundException('Asset not found');
	}
}


