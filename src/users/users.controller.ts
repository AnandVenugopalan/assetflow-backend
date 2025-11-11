import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { Request } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

class UpdateUserDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsIn(['ADMIN', 'MANAGER', 'USER'])
	role?: string;
}

class AssignRoleDto {
	@IsIn(['ADMIN', 'MANAGER', 'USER'])
	role: string;
}

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.user as { userId: string; email: string; role: string };
});

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	@Roles('ADMIN', 'MANAGER')
	findAll() {
		return this.usersService.findAll();
	}

	@Get('me')
	getProfile(@CurrentUser() user: { userId: string }) {
		return this.usersService.getProfile(user.userId);
	}

	@Get(':id')
	@Roles('ADMIN', 'MANAGER')
	findOne(@Param('id') id: string) {
		return this.usersService.findOne(id);
	}

	@Patch(':id')
	@Roles('ADMIN')
	update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
		return this.usersService.update(id, dto);
	}

	@Patch(':id/role')
	@Roles('ADMIN')
	assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) {
		return this.usersService.assignRole(id, dto.role);
	}

	@Delete(':id')
	@Roles('ADMIN')
	remove(@Param('id') id: string) {
		return this.usersService.remove(id);
	}
}


