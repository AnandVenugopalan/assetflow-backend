export class ProcurementMetricsDto {
  totalSpend: number;
  totalSpendChange: number;
  totalSpendChangePercent: string;

  totalRequests: number;
  totalRequestsChange: number;
  totalRequestsChangePercent: string;

  approvalRate: number;
  approvalRateChange: number;
  approvalRateChangePercent: string;

  avgRequestValue: number;
  avgRequestValueChange: number;
  avgRequestValueChangePercent: string;

  pendingRequests: number;
  pendingRequestsChange: number;
  pendingRequestsChangePercent: string;
}

export class ProcurementStatusDto {
  status: string; // Approved, Rejected, Pending
  count: number;
  percentage: number;
}

export class MonthlySpendDataDto {
  month: string;
  spend: number;
  requests: number;
}

export class CategorySpendDto {
  category: string;
  spend: number;
}

export class VendorPerformanceDto {
  vendorId: string;
  vendorName: string;
  cost: number;
  rating: number; // 0-5 scale
}

export class TopPurchasedCategoryDto {
  category: string;
  count: number;
}

export class VendorSummaryDto {
  vendorId: string;
  vendorName: string;
  totalSpend: number;
  rating: number;
  ratingDisplay: string; // e.g., "★★★★☆"
}

export class ProcurementAndCostIntelligenceDashboardDto {
  metrics: ProcurementMetricsDto;
  requestStatusDistribution: ProcurementStatusDto[];
  monthlySpendTrend: MonthlySpendDataDto[];
  categoryWiseSpend: CategorySpendDto[];
  vendorPerformance: VendorPerformanceDto[];
  topPurchasedCategories: TopPurchasedCategoryDto[];
  vendorSummary: VendorSummaryDto[];
  lastUpdated: Date;
}
