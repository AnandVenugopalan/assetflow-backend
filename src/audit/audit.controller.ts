import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.user as { userId: string; email: string; role: string };
});

@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'USER')
  async list() {
    try {
      return await this.auditService.list();
    } catch (error) {
      throw new HttpException('Failed to fetch audits', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'USER')
  async get(@Param('id') id: string) {
    try {
      return await this.auditService.get(id);
    } catch (error) {
      throw new HttpException('Audit record not found', HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  async create(@Body() dto: CreateAuditDto, @CurrentUser() user: { userId: string }) {
    try {
      return await this.auditService.create(dto, user.userId);
    } catch (error) {
      throw new HttpException('Failed to create audit record', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('asset/:assetId')
  @Roles('ADMIN', 'MANAGER', 'USER')
  async getByAsset(@Param('assetId') assetId: string) {
    try {
      return await this.auditService.getByAsset(assetId);
    } catch (error) {
      throw new HttpException('Failed to fetch audits for asset', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
