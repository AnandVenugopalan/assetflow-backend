import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateTransferDto {
  @IsString()
  @IsOptional()
  fromLocation?: string;

  @IsString()
  @IsOptional()
  toLocation?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  approvedById?: string;

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
