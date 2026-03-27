import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor(
		private readonly prisma: PrismaService,
		private readonly configService: ConfigService,
	) {
		super({
			clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
			clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
			callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3000/auth/google/callback',
			scope: ['profile', 'email'],
		});
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: any,
		done: VerifyCallback,
	): Promise<any> {
		try {
			const { id: googleId, displayName: name, emails } = profile;
			const email = emails?.[0]?.value;

			if (!email) {
				return done(new Error('No email found from Google profile'), false);
			}

			let user = await this.prisma.user.findUnique({
				where: { email },
			});

			if (user) {
				if (!user.googleId) {
					user = await this.prisma.user.update({
						where: { id: user.id },
						data: { googleId },
					});
				}
				return done(null, user);
			}

			user = await this.prisma.user.create({
				data: {
					name: name || email.split('@')[0],
					email,
					googleId,
					role: 'USER',
				},
			});

			return done(null, user);
		} catch (error) {
			return done(error, false);
		}
	}
}
