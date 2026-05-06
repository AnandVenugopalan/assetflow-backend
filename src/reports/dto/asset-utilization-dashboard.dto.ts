export class AssetMetricsDto {
  totalAssets: number;
  totalAssetsChange: number;
  totalAssetsChangePercent: string;

  utilizationRate: number;
  utilizationRateChange: number;
  utilizationRateChangePercent: string;

  availableAssets: number;
  availableAssetsChange: number;
  availableAssetsChangePercent: string;

  inMaintenanceAssets: number;
  inMaintenanceChange: number;
  inMaintenanceChangePercent: string;

  idleAssets: number;
  idleAssetsChange: number;
  idleAssetsChangePercent: string;
}

export class AssetStatusCountDto {
  status: string; // Available, Allocated, Maintenance
  count: number;
  percentage: number;
}

export class CategoryInventoryDto {
  category: string;
  inventory: number;
  allocated: number;
  available: number;
}

export class DepartmentAssetUsageDto {
  department: string;
  assetCount: number;
  utilizationRate: number;
}

export class AssetAgingDto {
  ageGroup: string; // 0-1 year, 1-3 years, 3-5 years, 5+ years
  count: number;
}

export class TopIdleAssetCategoryDto {
  category: string;
  idleCount: number;
}

export class AssetUtilizationDashboardDto {
  metrics: AssetMetricsDto;
  statusDistribution: AssetStatusCountDto[];
  inventoryByCategory: CategoryInventoryDto[];
  departmentWiseAssetUsage: DepartmentAssetUsageDto[];
  assetAgingAnalysis: AssetAgingDto[];
  topIdleAssetCategories: TopIdleAssetCategoryDto[];
  lastUpdated: Date;
}
