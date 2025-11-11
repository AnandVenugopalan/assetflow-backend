import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CalculateDepreciationDto {
  @IsString()
  assetId: string;

  @IsString()
  method: string; // 'slm' or 'wdv'

  @IsOptional()
  @IsNumber()
  usefulLife?: number;

  @IsOptional()
  @IsNumber()
  salvageValue?: number;
}