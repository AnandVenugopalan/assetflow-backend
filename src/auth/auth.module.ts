import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { MicrosoftStrategy } from './strategies/microsoft.strategy';
import { SessionSerializer } from './serialization/session.serializer';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
	imports: [
		ConfigModule,
		PrismaModule,
		PassportModule.register({ session: true }),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get<string>('JWT_SECRET') || 'dev_secret_change_me',
				signOptions: {
					expiresIn: '7d',
				},
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, GoogleStrategy, MicrosoftStrategy, SessionSerializer],
	exports: [AuthService],
})
export class AuthModule {}


