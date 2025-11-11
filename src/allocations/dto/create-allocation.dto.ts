import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAllocationDto {
	@IsString()
	assetId: string;

	@IsOptional()
	@IsString()
	assignedToId?: string;

	@IsOptional()
	@IsString()
	assignedById?: string;

	@IsOptional()
	@IsString()
	department?: string;

	@IsOptional()
	@IsDateString()
	startDate?: string;

	@IsOptional()
	@IsDateString()
	expectedReturn?: string;

	@IsOptional()
	@IsString()
	status?: string; // Active, Returned, Temporary

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	notes?: string;
}


