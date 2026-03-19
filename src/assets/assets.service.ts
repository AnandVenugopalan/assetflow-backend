import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

@Injectable()
export class AssetsService {
	constructor(private readonly prisma: PrismaService) {}

	async create(dto: CreateAssetDto) {
		// If QR code provided, check if asset already exists with that qrCode
		if (dto.qrCode) {
			const existingAsset = await this.prisma.asset.findFirst({
				where: { qrCode: dto.qrCode },
			});

			if (existingAsset) {
				throw new BadRequestException(
					`Asset already exists with QR code "${dto.qrCode}". Please use a different QR code or update the existing asset.`
				);
			}
		}

		// Create the asset
		const asset = await this.prisma.asset.create({
			data: {
				...dto,
				status: dto.status as any,
				purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
			},
		});

		return asset;
	}

	/**
	 * Find asset by QR code number (e.g., "100009" or "000100")
	 * Public endpoint - used when scanning QR codes
	 */
	async findByQR(qrCode: string) {
		const asset = await this.prisma.asset.findFirst({
			where: { qrCode: qrCode },
			include: {
				owner: { select: { id: true, name: true, email: true } },
				assignedTo: { select: { id: true, name: true, email: true } },
			},
		});

		if (!asset) {
			throw new NotFoundException(`Asset with QR code "${qrCode}" not found. Please create a new asset or check the QR code.`);
		}

		// Return all asset details (you can customize what to show)
		return {
			id: asset.id,
			name: asset.name,
			category: asset.category,
			serialNumber: asset.serialNumber,
			status: asset.status,
			location: asset.location,
			vendor: asset.vendor,
			department: asset.department,
			purchaseDate: asset.purchaseDate,
			purchaseCost: asset.purchaseCost,
			description: asset.description,
			warrantyExpiry: asset.warrantyExpiry,
			assignedTo: asset.assignedTo,
			qrCode: asset.qrCode,
			createdAt: asset.createdAt,
			updatedAt: asset.updatedAt,
		};
	}

	/**
	 * Link a QR code to an existing asset
	 * Used when asset is created first, then QR code is linked later
	 */
	async linkQRCodeToAsset(assetId: string, qrCode: string): Promise<any> {
		// Check if asset exists
		await this.ensureExists(assetId);

		// Check if QR code is already used by another asset
		const existingAsset = await this.prisma.asset.findFirst({
			where: { qrCode: qrCode },
		});

		if (existingAsset && existingAsset.id !== assetId) {
			throw new BadRequestException(
				`QR code "${qrCode}" is already linked to another asset. Please use a different QR code.`
			);
		}

		// Link QR code to asset
		const updatedAsset = await this.prisma.asset.update({
			where: { id: assetId },
			data: { qrCode: qrCode },
		});

		return {
			id: updatedAsset.id,
			name: updatedAsset.name,
			qrCode: updatedAsset.qrCode,
			message: `QR code "${qrCode}" successfully linked to asset "${updatedAsset.name}"`,
		};
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

	/**
	 * Get the next sequence number and increment the counter
	 * Ensures no duplicate numbers are generated
	 */
	private async getNextSequenceNumbers(quantity: number): Promise<number[]> {
		// Get or create the sequence tracker
		let sequence = await this.prisma.qRCodeSequence.findFirst();

		if (!sequence) {
			sequence = await this.prisma.qRCodeSequence.create({
				data: { currentNumber: 100000 },
			});
		}

		// Generate array of sequential numbers
		const numbers: number[] = [];
		for (let i = 0; i < quantity; i++) {
			numbers.push(sequence.currentNumber + i);
		}

		// Update the sequence counter for next batch
		await this.prisma.qRCodeSequence.update({
			where: { id: sequence.id },
			data: { currentNumber: sequence.currentNumber + quantity },
		});

		return numbers;
	}

	/**
	 * Format number to 6-digit string with leading zeros (e.g., 000100)
	 */
	private formatQRNumber(num: number): string {
		return num.toString().padStart(6, '0');
	}

	/**
	 * Generate QR code image as buffer
	 */
	private async generateQRCodeImage(qrNumber: string): Promise<Buffer> {
		return QRCode.toBuffer(qrNumber, {
			errorCorrectionLevel: 'H',
			type: 'png',
			width: 200,
			margin: 2,
		});
	}

	/**
	 * Generate batch of QR codes and return as PDF buffer
	 * Format: 3 columns per page, 55mm × 65mm per code
	 */
	async generateQRCodeBatch(quantity: number, userId?: string): Promise<{ buffer: Buffer; batchData: any }> {
		if (quantity < 1 || quantity > 100) {
			throw new BadRequestException('Quantity must be between 1 and 100');
		}

		// Get next sequence numbers
		const sequenceNumbers = await this.getNextSequenceNumbers(quantity);

		// Create batch record
		const batch = await this.prisma.qRCodeBatch.create({
			data: {
				startNumber: sequenceNumbers[0],
				endNumber: sequenceNumbers[sequenceNumbers.length - 1],
				quantity,
				generatedBy: userId,
			},
		});

		// Generate QR codes and create PDF
		const pdfBuffer = await this.createQRCodePDF(sequenceNumbers);

		// Update batch with PDF URL (you could store it in S3 or file system)
		// For now, we'll just track that it was generated
		await this.prisma.qRCodeBatch.update({
			where: { id: batch.id },
			data: { pdfUrl: `qr-batch-${batch.id}.pdf` },
		});

		return {
			buffer: pdfBuffer,
			batchData: {
				id: batch.id,
				batchNumber: batch.batchNumber,
				startNumber: this.formatQRNumber(batch.startNumber),
				endNumber: this.formatQRNumber(batch.endNumber),
				quantity: batch.quantity,
				createdAt: batch.createdAt,
			},
		};
	}

	/**
	 * Create PDF with QR codes
	 * Grid layout: 3 columns per page
	 * Size: 55mm × 65mm per code with borders
	 */
	private async createQRCodePDF(sequenceNumbers: number[]): Promise<Buffer> {
		return new Promise(async (resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'A4',
					margin: 10,
				});

				const chunks: Buffer[] = [];

				doc.on('data', (chunk: Buffer) => {
					chunks.push(chunk);
				});

				doc.on('end', () => {
					resolve(Buffer.concat(chunks));
				});

				doc.on('error', reject);

				// PDF dimensions in points (1mm = 2.834645669 points)
				const mmToPt = 2.834645669;
				const labelWidth = 55 * mmToPt; // ~155 points
				const labelHeight = 65 * mmToPt; // ~179 points
				const pageWidth = doc.page.width;
				const pageHeight = doc.page.height;

				// Layout: 3 columns, calculate positions
				const margin = 10;
				const availableWidth = pageWidth - margin * 2;
				const colWidth = availableWidth / 3;
				const xPositions = [
					margin + (colWidth - labelWidth) / 2,
					margin + colWidth + (colWidth - labelWidth) / 2,
					margin + colWidth * 2 + (colWidth - labelWidth) / 2,
				];

				let yPosition = margin + 10;
				let colIndex = 0;

				for (let i = 0; i < sequenceNumbers.length; i++) {
					// Check if we need a new page
					if (yPosition + labelHeight > pageHeight - margin) {
						doc.addPage();
						yPosition = margin + 10;
						colIndex = 0;
					}

					const qrNumber = this.formatQRNumber(sequenceNumbers[i]);
					const xPosition = xPositions[colIndex];

					// Draw border around label
					doc.rect(xPosition, yPosition, labelWidth, labelHeight).stroke();

					try {
						// Generate QR code image
						const qrImage = await this.generateQRCodeImage(qrNumber);

						// Draw QR code (centered in label, with space for number)
						const qrSize = 100;
						const qrX = xPosition + (labelWidth - qrSize) / 2;
						const qrY = yPosition + 10;

						doc.image(qrImage, qrX, qrY, { width: qrSize, height: qrSize });

						// Draw QR number below the code
						const numberY = qrY + qrSize + 5;
						doc.fontSize(10).text(qrNumber, xPosition, numberY, {
							width: labelWidth,
							align: 'center',
						});
					} catch (err) {
						console.error(`Error generating QR code for ${qrNumber}:`, err);
					}

					// Move to next column or next row
					colIndex++;
					if (colIndex === 3 || i === sequenceNumbers.length - 1) {
						yPosition += labelHeight + 10;
						colIndex = 0;
					}
				}

				doc.end();
			} catch (err) {
				reject(err);
			}
		});
	}

	/**
	 * Get all QR code batches
	 */
	async getQRCodeBatches() {
		return this.prisma.qRCodeBatch.findMany({
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				batchNumber: true,
				startNumber: true,
				endNumber: true,
				quantity: true,
				createdAt: true,
				isActive: true,
			},
		});
	}

	/**
	 * Get batch details by ID
	 */
	async getQRCodeBatchDetails(batchId: string) {
		const batch = await this.prisma.qRCodeBatch.findUnique({
			where: { id: batchId },
		});

		if (!batch) {
			throw new NotFoundException('QR Code batch not found');
		}

		return {
			...batch,
			startNumber: this.formatQRNumber(batch.startNumber),
			endNumber: this.formatQRNumber(batch.endNumber),
		};
	}
}


