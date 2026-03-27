import { Body, Controller, Post, UseGuards, Get, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	const request = ctx.switchToHttp().getRequest<Request>();
	return request.user as { userId: string; email: string; role: string };
});

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	register(@Body() dto: CreateUserDto) {
		return this.authService.register(dto);
	}

	@Post('login')
	login(@Body() dto: LoginDto) {
		return this.authService.login(dto);
	}

	/**
	 * Google OAuth Login
	 * Redirects to Google's OAuth consent screen
	 */
	@Get('google')
	@UseGuards(AuthGuard('google'))
	googleLogin() {
		// This endpoint is handled by Passport - it redirects to Google
	}

	/**
	 * Google OAuth Callback
	 * Called after user authenticates with Google
	 */
	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	googleCallback(@Req() req: Request, @Res() res: Response) {
		const user = req.user as any;
		const token = this.authService.generateJwt(user);
		const userJson = encodeURIComponent(JSON.stringify(user));
		res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}&user=${userJson}`);
	}

	/**
	 * Microsoft OAuth Login
	 * Redirects to Microsoft's OAuth consent screen
	 */
	@Get('microsoft')
	@UseGuards(AuthGuard('microsoft'))
	microsoftLogin() {
		// This endpoint is handled by Passport - it redirects to Microsoft
	}

	/**
	 * Microsoft OAuth Callback
	 * Called after user authenticates with Microsoft
	 */
	@Get('microsoft/callback')
	@UseGuards(AuthGuard('microsoft'))
	microsoftCallback(@Req() req: Request, @Res() res: Response) {
		const user = req.user as any;
		const token = this.authService.generateJwt(user);
		const userJson = encodeURIComponent(JSON.stringify(user));
		res.redirect(`${process.env.FRONTEND_URL}/dashboard?token=${token}&user=${userJson}`);
	}

	/**
	 * Get current authenticated user
	 */
	@Get('me')
	@UseGuards(AuthGuard('jwt'))
	getCurrentUser(@CurrentUser() user: { userId: string; email: string }) {
		return this.authService.getCurrentUser(user.userId);
	}

	@Post('logout')
	@UseGuards(AuthGuard('jwt'))
	logout(@CurrentUser() user: { userId: string; email: string }) {
		return this.authService.logout(user.userId);
	}
}


