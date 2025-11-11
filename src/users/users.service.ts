import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface UpdateUserInput {
	name?: string;
	email?: string;
	role?: string;
}

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	findAll() {
		return this.prisma.user.findMany({
			select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
			orderBy: { createdAt: 'desc' },
		});
	}

	async findOne(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
		});
		if (!user) throw new NotFoundException('User not found');
		return user;
	}

	async update(id: string, input: UpdateUserInput) {
		await this.ensureExists(id);
		return this.prisma.user.update({
			where: { id },
			data: {
				...input,
				role: input.role as any,
			},
			select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
		});
	}

	async remove(id: string) {
		await this.ensureExists(id);
		await this.prisma.user.delete({ where: { id } });
		return { success: true };
	}

	async assignRole(id: string, role: string) {
		await this.ensureExists(id);
		return this.prisma.user.update({
			where: { id },
			data: { role: role as any },
			select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
		});
	}

	getProfile(userId: string) {
		return this.findOne(userId);
	}

	private async ensureExists(id: string) {
		const exists = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
		if (!exists) throw new NotFoundException('User not found');
	}
}


