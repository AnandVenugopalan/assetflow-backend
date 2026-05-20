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
import { CreateProcurementRequestDto } from './dto/create-enterprise-procurement.dto';
import { ProcurementReviewDto, FinanceApprovalDto } from './dto/workflow.dto';
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
  @Roles('ADMIN', 'MANAGER', 'USER', 'PURCHASE_HEAD', 'FINANCE_MANAGER', 'DEPARTMENT_USER')
  async findAll() {
    return this.procurementService.findAll();
  }

  @Get('requests/my-requests')
  @Roles('ADMIN', 'MANAGER', 'USER', 'PURCHASE_HEAD', 'FINANCE_MANAGER', 'DEPARTMENT_USER')
  async findMyRequests(@CurrentUser() user: { userId: string }) {
    return this.procurementService.findMyRequests(user.userId);
  }

  @Get('requests/:id')
  @Roles('ADMIN', 'MANAGER', 'USER', 'PURCHASE_HEAD', 'FINANCE_MANAGER', 'DEPARTMENT_USER')
  async findOne(@Param('id') id: string) {
    return this.procurementService.findOne(id);
  }

  // Step 1: Create Request (Draft or Submitted)
  @Post('requests')
  @Roles('ADMIN', 'DEPARTMENT_USER', 'MANAGER')
  async create(@Body() createDto: CreateProcurementRequestDto, @CurrentUser() user: { userId: string }) {
    return this.procurementService.create(createDto, user.userId);
  }

  // Step 2: Procurement Review
  @Patch('requests/:id/review')
  @Roles('ADMIN', 'PURCHASE_HEAD')
  async procurementReview(@Param('id') id: string, @Body() reviewDto: ProcurementReviewDto, @CurrentUser() user: { userId: string }) {
    return this.procurementService.procurementReview(id, reviewDto, user.userId);
  }

  // Step 3: Finance Approval
  @Patch('requests/:id/finance-approval')
  @Roles('ADMIN', 'FINANCE_MANAGER')
  async financeApproval(@Param('id') id: string, @Body() approvalDto: FinanceApprovalDto, @CurrentUser() user: { userId: string }) {
    return this.procurementService.financeApproval(id, approvalDto, user.userId);
  }

  // Re-submit Clarification
  @Patch('requests/:id/submit-clarification')
  @Roles('ADMIN', 'DEPARTMENT_USER', 'MANAGER')
  async submitClarification(@Param('id') id: string, @Body() updateDto: any, @CurrentUser() user: { userId: string }) {
    return this.procurementService.submitClarification(id, updateDto, user.userId);
  }

  @Post('requests/:id/quotation')
  @Roles('ADMIN', 'PURCHASE_HEAD')
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
    if (!file) throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
    return this.procurementService.uploadDocument(id, 'quotationFile', file.filename);
  }

  @Post('requests/:id/technical-eval')
  @Roles('ADMIN', 'PURCHASE_HEAD')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + '-' + file.originalname);
        },
      }),
    }),
  )
  async uploadTechnicalEval(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) throw new HttpException('File not found', HttpStatus.BAD_REQUEST);
    return this.procurementService.uploadDocument(id, 'technicalEvalFile', file.filename);
  }

  // Dashboard Stats
  @Get('dashboard-stats')
  @Roles('ADMIN', 'MANAGER', 'USER', 'PURCHASE_HEAD', 'FINANCE_MANAGER', 'DEPARTMENT_USER')
  async getDashboardStats() {
    return this.procurementService.getDashboardStats();
  }
}

