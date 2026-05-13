export class RequestStatusDto {
  status: string; // Open, Closed, In Progress
  count: number;
  percentage: number;
}

export class PriorityDistributionDto {
  priority: string; // Low, Medium, High, Urgent
  count: number;
}

export class MonthlyTrendDataDto {
  month: string;
  value: number;
}

export class RepairFailureDto {
  assetId: string;
  assetName: string;
  failureCount: number;
  cost: number;
}

export class AssetHealthScoreDto {
  condition: string; // Good, Moderate, Poor
  count: number;
  percentage: number;
}

export class MaintenanceCostPerAssetDto {
  assetName: string;
  cost: number;
}

export class GapCoverageNoteDto {
  note: string;
}

export class MaintenanceMetricsDto {
  totalRequests: number;
  totalRequestsChange: number;
  totalRequestsChangePercent: string;

  openRequests: number;
  openRequestsChange: number;
  openRequestsChangePercent: string;

  maintenanceCost: number;
  maintenanceCostChange: number;
  maintenanceCostChangePercent: string;

  totalAssets: number;
  totalAssetsChange: number;
  totalAssetsChangePercent: string;

  closureRate: number;
  closureRateChange: number;
  closureRateChangePercent: string;

  avgResolutionTime: number; // days
  avgResolutionTimeChange: number;
  avgResolutionTimeChangePercent: string;
}

export class MaintenanceAndAssetHealthDashboardDto {
  metrics: MaintenanceMetricsDto;
  requestStatusDistribution: RequestStatusDto[];
  priorityDistribution: PriorityDistributionDto[];
  monthlyMaintenanceTrend: MonthlyTrendDataDto[];
  maintenanceCostTrend: MonthlyTrendDataDto[];
  avgResolutionTimeTrend: MonthlyTrendDataDto[];
  repairFailures: RepairFailureDto[];
  assetHealthScore: AssetHealthScoreDto[];
  maintenanceCostPerAsset: MaintenanceCostPerAssetDto[];
  gapCoverageNotes: GapCoverageNoteDto[];
  lastUpdated: Date;
}
