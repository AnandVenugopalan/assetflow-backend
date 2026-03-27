import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OAuthGuard extends AuthGuard('google') {
	handleRequest(err: any, user: any, info: any) {
		// If there's an error from the strategy or no user, throw it so exception filter catches it
		if (err) {
			throw err;
		}
		if (!user) {
			throw new Error('Authentication failed');
		}
		return user;
	}
}

@Injectable()
export class MicrosoftOAuthGuard extends AuthGuard('microsoft') {
	handleRequest(err: any, user: any, info: any) {
		// If there's an error from the strategy or no user, throw it so exception filter catches it
		if (err) {
			throw err;
		}
		if (!user) {
			throw new Error('Authentication failed');
		}
		return user;
	}
}
