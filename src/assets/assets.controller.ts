import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors, SetMetadata, Res } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { Response } from 'express';
import { GenerateQRCodeDto } from './dto/generate-qr.dto';
import { LinkQRCodeDto } from './dto/link-qr-code.dto';
import { MarkAsVerifiedDto } from './dto/mark-verified.dto';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.user as { userId: string; email: string; role: string };
});

@Controller('assets')
export class AssetsController {
	constructor(private readonly assetsService: AssetsService) {}

	@Post()
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	create(@Body() dto: CreateAssetDto) {
		return this.assetsService.create(dto);
	}

	/**
	 * Public endpoint for QR code scanning - no authentication required
	 * Used when scanning QR codes to find and load asset details
	 * QR code format: 6-digit number (e.g., "100009" or "000100")
	 */
	@Get('qr/:qrCode')
	findByQR(@Param('qrCode') qrCode: string) {
		return this.assetsService.findByQR(qrCode);
	}

	@Get()
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER', 'USER')
	findAll(@CurrentUser() user: { userId: string; role: string }, @Query('status') status?: string, @Query('type') type?: string, @Query('q') q?: string, @Query('assignedTo') assignedTo?: string) {
		return this.assetsService.findAll({ status, type, q, assignedTo }, user);
	}

	@Get(':id')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER', 'USER')
	findOne(@Param('id') id: string, @CurrentUser() user: { userId: string; role: string }) {
		return this.assetsService.findOne(id, user);
	}

	@Patch(':id')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
		return this.assetsService.update(id, dto);
	}

	@Delete(':id')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN')
	remove(@Param('id') id: string) {
		return this.assetsService.remove(id);
	}

	@Post(':id/documents')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	@UseInterceptors(
		FileInterceptor('file', {
			storage: diskStorage({
				destination: 'uploads/asset-documents',
				filename: (_req, file, cb) => {
					const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
					cb(null, `${unique}${extname(file.originalname)}`);
				},
			}),
			limits: { fileSize: 10 * 1024 * 1024 },
		}),
	)
	uploadDocument(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
		return this.assetsService.addDocument(id, {
			originalname: file.originalname,
			mimetype: file.mimetype,
			path: file.path,
		});
	}

	@Get(':id/documents')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER', 'USER')
	listDocuments(@Param('id') id: string) {
		return this.assetsService.listDocuments(id);
	}

	@Delete(':id/documents/:docId')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	deleteDocument(@Param('id') id: string, @Param('docId') docId: string) {
		return this.assetsService.deleteDocument(id, docId);
	}

	/**
	 * Link a QR code to an existing asset
	 * Used to assign a QR code number from the generated batch to an asset
	 */
	@Patch(':id/link-qr')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	linkQRCode(@Param('id') assetId: string, @Body() dto: LinkQRCodeDto) {
		return this.assetsService.linkQRCodeToAsset(assetId, dto.qrCode);
	}

	/**
	 * Generate QR codes in batch and download as PDF
	 * Sequential numbers prevent duplicates (e.g., 000100, 000101, etc.)
	 * PDF contains 3 columns per page with 55mm × 65mm labels
	 */
	@Post('qr-codes/generate')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	async generateQRCodes(
		@Body() dto: GenerateQRCodeDto,
		@CurrentUser() user: { userId: string; email: string; role: string },
		@Res() res: Response,
	) {
		const { buffer, batchData } = await this.assetsService.generateQRCodeBatch(dto.quantity, user.userId);

		// Set response headers for PDF download
		res.setHeader('Content-Type', 'application/pdf');
		res.setHeader('Content-Disposition', `attachment; filename="qr-codes-batch-${batchData.batchNumber}.pdf"`);
		res.setHeader('Content-Length', buffer.length);

		// Send the PDF buffer
		res.send(buffer);
	}

	/**
	 * Get all QR code batches history
	 */
	@Get('qr-codes/batches')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	getQRCodeBatches() {
		return this.assetsService.getQRCodeBatches();
	}

	/**
	 * Get specific QR code batch details
	 */
	@Get('qr-codes/batches/:batchId')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	getQRCodeBatchDetails(@Param('batchId') batchId: string) {
		return this.assetsService.getQRCodeBatchDetails(batchId);
	}

	/**
	 * Mark an asset as verified
	 * Creates an audit record with VERIFIED status
	 * Used by the "Verify Assets" page to mark assets as verified
	 */
	@Patch(':id/verify')
	@UseGuards(AuthGuard('jwt'), RolesGuard)
	@Roles('ADMIN', 'MANAGER')
	markAsVerified(
		@Param('id') assetId: string,
		@Body() dto: MarkAsVerifiedDto,
		@CurrentUser() user: { userId: string; email: string; role: string },
	) {
		return this.assetsService.markAsVerified(
			assetId,
			user.userId,
			dto.remarks,
			dto.condition || 'GOOD'
		);
	}
}


