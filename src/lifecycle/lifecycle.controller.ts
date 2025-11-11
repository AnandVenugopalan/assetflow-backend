import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { LifecycleService } from './lifecycle.service';
import { LifecycleDto } from './dto/lifecycle.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.user as { userId: string; email: string; role: string };
});

@Controller('lifecycle')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LifecycleController {
	constructor(private readonly lifecycleService: LifecycleService) {}

	@Post()
	@Roles('ADMIN', 'MANAGER')
	create(@Body() dto: LifecycleDto, @CurrentUser() user: { userId: string }) {
		return this.lifecycleService.create(dto, user.userId);
	}

	@Get('asset/:assetId')
	@Roles('ADMIN', 'MANAGER', 'USER')
	listByAsset(@Param('assetId') assetId: string) {
		return this.lifecycleService.listByAsset(assetId);
	}

	@Get()
	@Roles('ADMIN', 'MANAGER', 'USER')
	list(@Query('assetId') assetId?: string, @Query('stage') stage?: string) {
		return this.lifecycleService.list({ assetId, stage });
	}

	@Patch(':id')
	@Roles('ADMIN', 'MANAGER')
	update(@Param('id') id: string, @Body() body: any) {
		return this.lifecycleService.update(id, body);
	}
}


