import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DisposalsService } from './disposals.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../users/roles.guard';
import { Roles } from '../users/roles.decorator';
import { CreateDisposalDto } from './dto/create-disposal.dto';
import { UpdateDisposalDto } from './dto/update-disposal.dto';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.user as { userId: string; email: string; role: string };
});

@Controller('disposals')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DisposalsController {
	constructor(private readonly disposalsService: DisposalsService) {}

	@Get()
	@Roles('ADMIN', 'MANAGER', 'USER')
	list() {
		return this.disposalsService.list();
	}

	@Get('stats')
	@Roles('ADMIN', 'MANAGER', 'USER')
	async getStats() {
		return this.disposalsService.getDisposalStats();
	}

	@Get(':id')
	@Roles('ADMIN', 'MANAGER', 'USER')
	get(@Param('id') id: string) {
		return this.disposalsService.get(id);
	}

	@Post()
	@Roles('ADMIN', 'MANAGER', 'USER')
	create(@Body() dto: CreateDisposalDto, @CurrentUser() user: { userId: string }) {
		return this.disposalsService.create(dto, user.userId);
	}

	@Patch(':id')
	@Roles('ADMIN', 'MANAGER')
	update(@Param('id') id: string, @Body() dto: UpdateDisposalDto) {
		return this.disposalsService.update(id, dto);
	}
}


