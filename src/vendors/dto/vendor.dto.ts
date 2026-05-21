import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateVendorDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  contactPerson?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  gstNumber?: string;

  @IsNumber()
  @IsOptional()
  rating?: number;

  @IsBoolean()
  @IsOptional()
  isPreferred?: boolean;
}

export class UpdateVendorDto extends CreateVendorDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
