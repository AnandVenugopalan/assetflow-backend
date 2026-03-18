import { IsNumber, Min, Max } from 'class-validator';

export class GenerateQRCodeDto {
  @IsNumber()
  @Min(1, { message: 'Number of QR codes must be at least 1' })
  @Max(100, { message: 'Number of QR codes cannot exceed 100 per batch' })
  quantity: number;
}
