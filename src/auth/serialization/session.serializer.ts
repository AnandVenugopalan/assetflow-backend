import { PassportSerializer } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
	constructor(private readonly prisma: PrismaService) {
		super();
	}

	serializeUser(user: any, done: (err: Error | null, id?: string) => void): void {
		done(null, user.id);
	}

	async deserializeUser(
		id: string,
		done: (err: Error | null, user?: Express.User | false | null) => void,
	): Promise<void> {
		try {
			const user = await this.prisma.user.findUnique({ where: { id } });
			done(null, user);
		} catch (error) {
			done(error);
		}
	}
}
