import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';

@Controller('maintenance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MaintenanceController {
	constructor(private readonly maintenanceService: MaintenanceService) {}

	@Get()
	@Roles('ADMIN', 'MANAGER', 'USER')
	list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
		return this.maintenanceService.list({
			page: page ? Number(page) : undefined,
			pageSize: pageSize ? Number(pageSize) : undefined,
		});
	}

	@Post()
	@Roles('ADMIN', 'MANAGER')
	create(@Body() dto: CreateMaintenanceDto) {
		return this.maintenanceService.create(dto);
	}

	@Patch(':id')
	@Roles('ADMIN', 'MANAGER')
	update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto) {
		return this.maintenanceService.update(id, dto);
	}
}


