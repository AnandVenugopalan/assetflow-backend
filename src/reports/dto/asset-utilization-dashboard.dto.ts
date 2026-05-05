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

export class AssetUtilizationDashboardDto {
  metrics: AssetMetricsDto;
  statusDistribution: AssetStatusCountDto[];
  inventoryByCategory: CategoryInventoryDto[];
  lastUpdated: Date;
}
