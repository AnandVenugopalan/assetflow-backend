import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const totalAssets = await this.prisma.asset.count();
    
    const assetsByCategory = await this.prisma.asset.groupBy({
      by: ['category'],
      _count: true,
    });

    const assetsByStatus = await this.prisma.asset.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalMaintenance = await this.prisma.maintenance.count();
    const maintenanceByStatus = await this.prisma.maintenance.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalDisposals = await this.prisma.disposal.count();
    const disposalsByStatus = await this.prisma.disposal.groupBy({
      by: ['status'],
      _count: true,
    });

    // Depreciation totals (sum of purchase cost vs current value)
    const assetsWithValue = await this.prisma.asset.findMany({
      where: {
        purchaseCost: { not: null },
      },
      select: {
        purchaseCost: true,
        currentValue: true,
      },
    });

    const depreciationTotals = {
      totalPurchaseCost: assetsWithValue.reduce((sum, a) => sum + (a.purchaseCost || 0), 0),
      totalCurrentValue: assetsWithValue.reduce((sum, a) => sum + (a.currentValue || 0), 0),
    };

    const valuationSummary = {
      totalValue: depreciationTotals.totalCurrentValue,
      totalDepreciation: depreciationTotals.totalPurchaseCost - depreciationTotals.totalCurrentValue,
    };

    const maintenanceStats = {
      total: totalMaintenance,
      byStatus: maintenanceByStatus,
      totalCost: await this.prisma.maintenance.aggregate({
        _sum: { actualCost: true, estimatedCost: true },
      }),
    };

    return {
      totalAssets,
      assetsByCategory,
      assetsByStatus,
      depreciationTotals,
      valuationSummary,
      maintenanceStats,
      totalDisposals,
      disposalsByStatus,
    };
  }
}
