import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateAuditDto {
  @IsString()
  assetId: string;

	@IsIn(['GOOD', 'MODERATE', 'DAMAGED'])
	condition: string;

	@IsIn(['VERIFIED', 'NOT_FOUND', 'MOVED'])
	verificationStatus: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}