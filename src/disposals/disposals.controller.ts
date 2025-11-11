import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DisposalsService } from './disposals.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../users/roles.guard';
import { Roles } from '../users/roles.decorator';
import { CreateDisposalDto } from './dto/create-disposal.dto';
import { UpdateDisposalDto } from './dto/update-disposal.dto';

@Controller('disposals')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DisposalsController {
	constructor(private readonly disposalsService: DisposalsService) {}

	@Get()
	@Roles('ADMIN', 'MANAGER', 'USER')
	list() {
		return this.disposalsService.list();
	}

	@Get(':id')
	@Roles('ADMIN', 'MANAGER', 'USER')
	get(@Param('id') id: string) {
		return this.disposalsService.get(id);
	}

	@Post()
	@Roles('ADMIN', 'MANAGER')
	create(@Body() dto: CreateDisposalDto) {
		return this.disposalsService.create(dto);
	}

	@Patch(':id')
	@Roles('ADMIN', 'MANAGER')
	update(@Param('id') id: string, @Body() dto: UpdateDisposalDto) {
		return this.disposalsService.update(id, dto);
	}
}


