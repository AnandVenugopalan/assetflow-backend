import { IsIn, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateAssetDto {
	@IsString()
	name: string;

	@IsString()
	category: string;

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

	@IsOptional()
	@IsString()
	vendor?: string;

	@IsOptional()
	@IsString()
	department?: string;

	@IsOptional()
	@IsNumber()
	purchaseCost?: number;

	@IsOptional()
	@IsDateString()
	purchaseDate?: string;

	@IsOptional()
	@IsString()
	description?: string;
}


