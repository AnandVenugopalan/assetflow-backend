import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.user as { userId: string; email: string; role: string };
});

@Controller('maintenance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MaintenanceController {
	constructor(private readonly maintenanceService: MaintenanceService) {}

	@Get()
	@Roles('ADMIN', 'MANAGER', 'USER')
	list(@CurrentUser() user: { userId: string; role: string }, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
		return this.maintenanceService.list({
			page: page ? Number(page) : undefined,
			pageSize: pageSize ? Number(pageSize) : undefined,
		}, user);
	}

	@Post()
	@Roles('ADMIN', 'MANAGER', 'USER')
	create(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: { userId: string; role: string }) {
		return this.maintenanceService.create(dto, user);
	}

	@Patch(':id')
	@Roles('ADMIN', 'MANAGER')
	update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
		return this.maintenanceService.update(id, dto);
	}
}


