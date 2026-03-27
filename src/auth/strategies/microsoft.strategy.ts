import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { Injectable, UnauthorizedException } from '@nestjs/common';
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

			console.log('MicrosoftStrategy.validate() called with email:', email);

			if (!email) {
				const err = new Error('No email found from Microsoft profile');
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

			if (!user.microsoftId) {
				user = await this.prisma.user.update({
					where: { id: user.id },
					data: { microsoftId },
				});
			}
			return done(null, user);
		} catch (error) {
			console.log('MicrosoftStrategy catch error:', (error as any).message);
			return done(error, false);
		}
	}
}
