import { IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDisposalDto {
	@IsString()
	assetId: string;

	@IsString()
	@MaxLength(500)
	reason: string;

	@IsString()
	@MaxLength(1000)
	description: string;

	@IsOptional()
	@IsString()
	method?: string; // Sale, Scrap, Donation, etc.

	@IsOptional()
	@IsNumber()
	estimatedValue?: number;

	@IsOptional()
	@IsNumber()
	salvageValue?: number;

	@IsOptional()
	@IsIn(['REQUESTED', 'APPROVED', 'REJECTED', 'DISPOSED'])
	status?: string;
}


