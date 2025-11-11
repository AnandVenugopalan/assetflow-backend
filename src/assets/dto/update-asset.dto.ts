import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAssetDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsString()
	serialNumber?: string;

	@IsOptional()
	@IsNumber()
	price?: number;

	@IsOptional()
	@IsIn(['PROCUREMENT', 'COMMISSIONED', 'ALLOCATED', 'IN_OPERATION', 'MAINTENANCE', 'AUDIT', 'VALUATION', 'TRANSFER', 'DISPOSAL'])
	status?: string;

	@IsOptional()
	@IsString()
	location?: string;

	@IsOptional()
	@IsString()
	ownerUserId?: string;
}


