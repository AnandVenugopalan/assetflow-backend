import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
	constructor(private readonly prisma: PrismaService) {}

	private signToken(payload: object): string {
		return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret_change_me', {
			expiresIn: '1h',
		});
	}

	async register(dto: CreateUserDto) {
		const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
		if (existing) {
			throw new BadRequestException('Email already registered');
		}
		const passwordHash = await bcrypt.hash(dto.password, 10);
		const user = await this.prisma.user.create({
			data: {
				name: dto.name,
				email: dto.email,
				passwordHash,
				role: (dto.role as any) ?? undefined,
			},
			select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
		});
		const accessToken = this.signToken({ sub: user.id, email: user.email, role: user.role });
		return { user, accessToken };
	}

	async validateUser(email: string, password: string) {
		const user = await this.prisma.user.findUnique({ where: { email } });
		if (!user) return null;
		const valid = await bcrypt.compare(password, user.passwordHash);
		if (!valid) return null;
		return user;
	}

	async login(dto: LoginDto) {
		const user = await this.validateUser(dto.email, dto.password);
		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}
		const accessToken = this.signToken({ sub: user.id, email: user.email, role: user.role });
		return {
			user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt },
			accessToken,
		};
	}
}


