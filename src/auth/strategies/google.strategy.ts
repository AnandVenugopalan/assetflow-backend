import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException } from '@nestjs/common';
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

			console.log('GoogleStrategy.validate() called with email:', email);

			if (!email) {
				const err = new UnauthorizedException('No email found from Google profile');
				console.log('No email found, returning error');
				return done(err, false);
			}

			let user = await this.prisma.user.findUnique({
				where: { email },
			});

			console.log('User lookup result for', email, ':', user ? 'Found' : 'Not found');

			if (!user) {
				// User not registered - return error
				const err = new Error(`Email ${email} is not registered. Please sign up first.`);
				console.log('User not registered, returning error:', err.message);
				return done(err, false);
			}

			console.log('User authenticated:', user.email);

			if (!user.googleId) {
				user = await this.prisma.user.update({
					where: { id: user.id },
					data: { googleId },
				});
			}
			return done(null, user);
		} catch (error) {
			console.log('GoogleStrategy catch error:', (error as any).message);
			return done(error, false);
		}
	}
}
