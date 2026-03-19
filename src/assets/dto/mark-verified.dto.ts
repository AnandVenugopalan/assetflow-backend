import { IsOptional, IsString } from 'class-validator';

export class MarkAsVerifiedDto {
  @IsOptional()
  @IsString()
  remarks?: string; // Optional notes about the verification
  
  @IsOptional()
  @IsString()
  condition?: string; // Optional: GOOD, MODERATE, DAMAGED (defaults to GOOD)
}
