import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class ProcurementReviewDto {
  @IsString()
  @IsOptional()
  vendorId?: string;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsDateString()
  @IsOptional()
  expectedDeliveryDate?: string;

  @IsString()
  @IsOptional()
  procurementNotes?: string;
  
  @IsString()
  action: 'FORWARD_TO_FINANCE' | 'REJECT' | 'REQUEST_CLARIFICATION';
}

export class FinanceApprovalDto {
  @IsNumber()
  @IsOptional()
  approvedAmount?: number;

  @IsString()
  @IsOptional()
  financeRemarks?: string;

  @IsString()
  action: 'APPROVE' | 'REJECT' | 'SEND_BACK';
}

export class CreatePurchaseOrderDto {
  @IsString()
  poNumber: string;

  @IsString()
  vendorId: string;

  @IsString()
  procurementRequestId: string;

  @IsDateString()
  date: string;

  @IsDateString()
  @IsOptional()
  expectedDelivery?: string;

  @IsNumber()
  @IsOptional()
  approvedAmount?: number;

  @IsString()
  @IsOptional()
  paymentTerms?: string;
}
