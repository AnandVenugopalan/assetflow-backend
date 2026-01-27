import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDisposalDto {
	@IsOptional()
	@IsIn(['REQUESTED', 'APPROVED', 'REJECTED', 'DISPOSED'])
	status?: string;

	@IsOptional()
	@IsString()
	method?: string;

	@IsOptional()
	@IsNumber()
	estimatedValue?: number;

	@IsOptional()
	@IsNumber()
	salvageValue?: number;
}


