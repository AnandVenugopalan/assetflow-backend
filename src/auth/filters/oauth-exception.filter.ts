import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class OAuthExceptionFilter implements ExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest();

		// Only handle OAuth-related errors for callback routes
		if (!request.url.includes('/callback')) {
			throw exception;
		}

		let errorMessage = 'Authentication failed';

		// Extract error message from various exception formats
		if (exception?.message) {
			errorMessage = exception.message;
		}

		console.log('OAuthExceptionFilter - Redirecting to login with error:', errorMessage);

		// Redirect to login with error parameter
		response.redirect(
			`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(errorMessage)}`,
		);
	}
}
