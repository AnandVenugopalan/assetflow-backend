import { IsString } from 'class-validator';

export class LinkQRCodeDto {
	@IsString()
	qrCode: string; // QR code number to link (e.g., "100009")
}
