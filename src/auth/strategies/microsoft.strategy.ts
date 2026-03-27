import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
	constructor(
		private readonly prisma: PrismaService,
		private readonly configService: ConfigService,
	) {
		super({
			clientID: configService.get<string>('MICROSOFT_CLIENT_ID') || '',
			clientSecret: configService.get<string>('MICROSOFT_SECRET_VALUE') || '',
			callbackURL: configService.get<string>('MICROSOFT_CALLBACK_URL') || 'http://localhost:3000/auth/microsoft/callback',
			scope: ['user.read'],
		});
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifyCallback,
	): Promise<any> {
		try {
			const { id: microsoftId, displayName: name, emails } = profile;
			const email = emails?.[0]?.value;

			if (!email) {
				return done(new Error('No email found from Microsoft profile'), false);
			}

			let user = await this.prisma.user.findUnique({
				where: { email },
			});

			if (user) {
				if (!user.microsoftId) {
					user = await this.prisma.user.update({
						where: { id: user.id },
						data: { microsoftId },
					});
				}
				return done(null, user);
			}

			user = await this.prisma.user.create({
				data: {
					name: name || email.split('@')[0],
					email,
					microsoftId,
					role: 'USER',
				},
			});

			return done(null, user);
		} catch (error) {
			return done(error, false);
		}
	}
}
