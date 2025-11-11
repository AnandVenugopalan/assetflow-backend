import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDisposalDto {
	@IsString()
	assetId: string;

	@IsOptional()
	@IsString()
	method?: string; // Sale, Scrap, Donation, etc.

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	reason?: string;

	@IsOptional()
	@IsNumber()
	estimatedValue?: number;

	@IsOptional()
	@IsNumber()
	salvageValue?: number;

	@IsOptional()
	@IsString()
	approvedById?: string;

	@IsOptional()
	@IsDateString()
	disposedDate?: string;

	@IsOptional()
	@IsIn(['REQUESTED', 'APPROVED', 'REJECTED', 'DISPOSED'])
	status?: string;
}


