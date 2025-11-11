import { IsDateString, IsIn, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMaintenanceDto {
	@IsOptional()
	@IsIn(['PREVENTIVE', 'BREAKDOWN', 'SCHEDULED'])
	type?: string;

	@IsOptional()
	@IsIn(['LOW', 'MEDIUM', 'HIGH'])
	priority?: string;

	@IsOptional()
	@IsIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'])
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


