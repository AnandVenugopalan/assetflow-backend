import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ProcurementService } from './procurement.service';
import { CreateProcurementDto } from './dto/create-procurement.dto';
import { UpdateProcurementDto } from './dto/update-procurement.dto';
import { ApproveProcurementDto } from './dto/approve-procurement.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user as { userId: string; email: string; role: string };
});

@Controller('procurement')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('requests')
  @Roles('ADMIN', 'MANAGER', 'USER')
  async findAll() {
    try {
      return await this.procurementService.findAll();
    } catch (error) {
      throw new HttpException('Failed to fetch procurement requests', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('requests/:id')
  @Roles('ADMIN', 'MANAGER', 'USER')
  async findOne(@Param('id') id: string) {
    try {
      return await this.procurementService.findOne(id);
    } catch (error) {
      throw new HttpException('Procurement request not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post('requests')
  @Roles('ADMIN', 'MANAGER')
  async create(@Body() createProcurementDto: CreateProcurementDto) {
    try {
      return await this.procurementService.create(createProcurementDto);
    } catch (error) {
      throw new HttpException('Failed to create procurement request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('requests/:id')
  @Roles('ADMIN', 'MANAGER')
  async update(@Param('id') id: string, @Body() updateProcurementDto: UpdateProcurementDto) {
    try {
      return await this.procurementService.update(id, updateProcurementDto);
    } catch (error) {
      throw new HttpException('Failed to update procurement request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('requests/:id/quotation')
  @Roles('ADMIN', 'MANAGER')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/quotations',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        },
      }),
    }),
  )
  async uploadQuotation(@Param('id') id: string, @UploadedFile() file: any) {
    try {
      return await this.procurementService.uploadQuotation(id, file.filename);
    } catch (error) {
      throw new HttpException('Failed to upload quotation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('vendors')
  @Roles('ADMIN', 'MANAGER', 'USER')
  async getVendors() {
    try {
      return await this.procurementService.getVendors();
    } catch (error) {
      throw new HttpException('Failed to fetch vendors', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('workflow-stats')
  @Roles('ADMIN', 'MANAGER', 'USER')
  async getWorkflowStats() {
    try {
      return await this.procurementService.getWorkflowStats();
    } catch (error) {
      throw new HttpException('Failed to fetch workflow stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('requests/:id/approve')
  @Roles('MANAGER')
  async approve(@Param('id') id: string, @Body() dto: ApproveProcurementDto, @CurrentUser() user: { userId: string }) {
    try {
      return await this.procurementService.approveRequest(id, user.userId, dto.reason);
    } catch (error) {
      throw new HttpException(error.message || 'Failed to approve procurement request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('requests/:id/reject')
  @Roles('MANAGER')
  async reject(@Param('id') id: string, @Body() dto: ApproveProcurementDto, @CurrentUser() user: { userId: string }) {
    try {
      return await this.procurementService.rejectRequest(id, user.userId, dto.reason);
    } catch (error) {
      throw new HttpException(error.message || 'Failed to reject procurement request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
