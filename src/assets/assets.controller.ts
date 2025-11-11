import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('assets')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AssetsController {
	constructor(private readonly assetsService: AssetsService) {}

	@Post()
	@Roles('ADMIN', 'MANAGER')
	create(@Body() dto: CreateAssetDto) {
		return this.assetsService.create(dto);
	}

	@Get()
	@Roles('ADMIN', 'MANAGER', 'USER')
	findAll(@Query('status') status?: string, @Query('type') type?: string, @Query('q') q?: string) {
		return this.assetsService.findAll({ status, type, q });
	}

	@Get(':id')
	@Roles('ADMIN', 'MANAGER', 'USER')
	findOne(@Param('id') id: string) {
		return this.assetsService.findOne(id);
	}

	@Patch(':id')
	@Roles('ADMIN', 'MANAGER')
	update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
		return this.assetsService.update(id, dto);
	}

	@Delete(':id')
	@Roles('ADMIN')
	remove(@Param('id') id: string) {
		return this.assetsService.remove(id);
	}

	@Post(':id/documents')
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
	@Roles('ADMIN', 'MANAGER', 'USER')
	listDocuments(@Param('id') id: string) {
		return this.assetsService.listDocuments(id);
	}

	@Delete(':id/documents/:docId')
	@Roles('ADMIN', 'MANAGER')
	deleteDocument(@Param('id') id: string, @Param('docId') docId: string) {
		return this.assetsService.deleteDocument(id, docId);
	}
}


