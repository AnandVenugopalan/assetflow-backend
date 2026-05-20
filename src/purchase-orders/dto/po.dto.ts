import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreatePoDto {
  @IsString()
  vendorId: string;

  @IsString()
  procurementRequestId: string;

  @IsNumber()
  @IsOptional()
  approvedAmount?: number;

  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @IsDateString()
  @IsOptional()
  expectedDelivery?: string;
}

export class UpdatePoDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  poFilePath?: string;
}
