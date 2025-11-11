import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AllocationsService } from './allocations.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../users/roles.guard';
import { Roles } from '../users/roles.decorator';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { UpdateAllocationDto } from './dto/update-allocation.dto';

@Controller('allocations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AllocationsController {
	constructor(private readonly allocationsService: AllocationsService) {}

	@Get()
	@Roles('ADMIN', 'MANAGER', 'USER')
	list() {
		return this.allocationsService.list();
	}

	@Get(':id')
	@Roles('ADMIN', 'MANAGER', 'USER')
	get(@Param('id') id: string) {
		return this.allocationsService.get(id);
	}

	@Post()
	@Roles('ADMIN', 'MANAGER')
	create(@Body() dto: CreateAllocationDto) {
		return this.allocationsService.create(dto);
	}

	@Patch(':id')
	@Roles('ADMIN', 'MANAGER')
	update(@Param('id') id: string, @Body() dto: UpdateAllocationDto) {
		return this.allocationsService.update(id, dto);
	}

	@Post(':id/check-in')
	@Roles('ADMIN', 'MANAGER')
	checkIn(@Param('id') id: string) {
		return this.allocationsService.checkIn(id);
	}

	@Post(':id/check-out')
	@Roles('ADMIN', 'MANAGER')
	checkOut(@Param('id') id: string) {
		return this.allocationsService.checkOut(id);
	}

	@Get('transfer-log/_recent')
	@Roles('ADMIN', 'MANAGER', 'USER')
	transferLog() {
		return this.allocationsService.transferLog();
	}
}


