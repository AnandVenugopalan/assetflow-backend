import { IsDateString, IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateMaintenanceDto {
	@IsOptional()
	@Matches(/^(PREVENTIVE|BREAKDOWN|SCHEDULED)$/i)
	type?: string;

	@IsOptional()
	@Matches(/^(LOW|MEDIUM|HIGH)$/i)
	priority?: string;

	@IsOptional()
	@Matches(/^(SCHEDULED|IN_PROGRESS|COMPLETED)$/i)
	status?: string;

	@IsOptional()
	@IsString()
	@MaxLength(120)
	vendor?: string;

	@IsOptional()
	@IsNumber()
	estimatedCost?: number;

	@IsOptional()
	@IsNumber()
	actualCost?: number;

	@IsOptional()
	@IsDateString()
	scheduledDate?: string;

	@IsOptional()
	@IsDateString()
	dueDate?: string;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	notes?: string;

	@IsOptional()
	@IsString()
	reportedById?: string;

	@IsOptional()
	@IsString()
	assignedToId?: string;
}


