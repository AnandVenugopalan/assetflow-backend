import { IsOptional, IsString } from 'class-validator';

export class ApproveProcurementDto {
  @IsOptional()
  @IsString()
  reason?: string;
}