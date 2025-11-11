import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAllocationDto {
	@IsOptional()
	@IsString()
	assignedToId?: string;

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
	status?: string;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	notes?: string;
}


