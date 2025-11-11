import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyDocument } from './property-document.interface';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';

@Controller('properties')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'USER')
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'USER')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(createPropertyDto);
  }

  @Post(':id/documents')
  @Roles('ADMIN', 'MANAGER')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/properties',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        },
      }),
    }),
  )
  async uploadDocuments(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const uploads: PropertyDocument[] = [];
    for (const file of files) {
      const doc = await this.propertiesService.saveDocument(
        id,
        file.originalname,
        file.path,
        file.mimetype.startsWith('image') ? 'image' : 'deed',
      );
      uploads.push(doc);
    }
    return uploads;
  }

  @Get(':id/documents')
  @Roles('ADMIN', 'MANAGER', 'USER')
  getDocuments(@Param('id') id: string) {
    return this.propertiesService.getDocuments(id);
  }

  @Delete(':id/documents/:docId')
  @Roles('ADMIN', 'MANAGER')
  deleteDocument(@Param('docId') docId: string) {
    return this.propertiesService.deleteDocument(docId);
  }
}
