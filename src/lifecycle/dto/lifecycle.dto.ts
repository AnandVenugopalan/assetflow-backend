import { IsIn, IsOptional, IsString } from 'class-validator';

export class LifecycleDto {
	@IsString()
	assetId: string;

	@IsIn(['PROCUREMENT', 'COMMISSIONED', 'ALLOCATED', 'IN_OPERATION', 'MAINTENANCE', 'AUDIT', 'VALUATION', 'TRANSFER', 'DISPOSAL'])
	stage: string;

	@IsOptional()
	@IsString()
	notes?: string;
}


