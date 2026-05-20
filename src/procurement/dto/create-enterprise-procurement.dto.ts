import { IsString, IsOptional, IsNumber, IsInt, IsEnum, IsDateString } from 'class-validator';

export class CreateProcurementRequestDto {
  @IsString()
  @IsOptional()
  requestTitle?: string;

  @IsString()
  itemName: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  assetType?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsInt()
  quantity: number;

  @IsDateString()
  @IsOptional()
  requiredDate?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  justification?: string;

  @IsString()
  @IsOptional()
  technicalSpecs?: string;

  @IsString()
  @IsOptional()
  status?: string; // DRAFT or SUBMITTED
}
