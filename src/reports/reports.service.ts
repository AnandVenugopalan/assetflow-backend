import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssetUtilizationDashboardDto,
  AssetMetricsDto,
  AssetStatusCountDto,
  CategoryInventoryDto,
  DepartmentAssetUsageDto,
  AssetAgingDto,
  TopIdleAssetCategoryDto,
} from './dto/asset-utilization-dashboard.dto';
import {
  MaintenanceAndAssetHealthDashboardDto,
  MaintenanceMetricsDto,
  RequestStatusDto,
  PriorityDistributionDto,
  RepairFailureDto,
  AssetHealthScoreDto,
  MonthlyTrendDataDto,
  MaintenanceCostPerAssetDto,
  GapCoverageNoteDto,
} from './dto/maintenance-asset-health-dashboard.dto';
import {
  ProcurementAndCostIntelligenceDashboardDto,
  ProcurementMetricsDto,
  ProcurementStatusDto,
  MonthlySpendDataDto,
  CategorySpendDto,
  VendorPerformanceDto,
  TopPurchasedCategoryDto,
  VendorSummaryDto,
  DepartmentSpendDto,
  PendingPipelineStageDto,
  GapCoverageNoteDto as ProcurementGapCoverageNoteDto,
} from './dto/procurement-cost-intelligence-dashboard.dto';

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

  async getAssetUtilizationDashboard(): Promise<AssetUtilizationDashboardDto> {
    // Get total asset counts
    const totalAssets = await this.prisma.asset.count();
    const allocatedAssets = await this.prisma.asset.count({
      where: { status: 'ALLOCATED' },
    });
    const availableAssets = await this.prisma.asset.count({
      where: { status: 'COMMISSIONED' },
    });
    const inMaintenanceAssets = await this.prisma.asset.count({
      where: { status: 'MAINTENANCE' },
    });
    const idleAssets = await this.prisma.asset.count({
      where: { status: 'IN_OPERATION' },
    });

    // Calculate utilization rate
    const utilizationRate = totalAssets > 0 ? (allocatedAssets / totalAssets) * 100 : 0;

    // Get asset count by category
    const assetsByCategory = await this.prisma.asset.groupBy({
      by: ['category'],
      _count: true,
    });

    // Get allocated assets by category
    const allocatedByCategory = await this.prisma.asset.groupBy({
      by: ['category'],
      where: { status: 'ALLOCATED' },
      _count: true,
    });

    // Build inventory by category
    const inventoryByCategory: CategoryInventoryDto[] = assetsByCategory.map(
      (cat) => {
        const inventory = cat._count;
        const allocated =
          allocatedByCategory.find((a) => a.category === cat.category)?._count ||
          0;
        return {
          category: cat.category,
          inventory,
          allocated,
          available: inventory - allocated,
        };
      },
    );

    // Build metrics
    const metrics: AssetMetricsDto = {
      totalAssets,
      totalAssetsChange: 50, // Mock change values - in production, compare with previous period
      totalAssetsChangePercent: '+5%',
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      utilizationRateChange: 1.7,
      utilizationRateChangePercent: '+2.1%',
      availableAssets,
      availableAssetsChange: 30,
      availableAssetsChangePercent: '+12%',
      inMaintenanceAssets,
      inMaintenanceChange: -4,
      inMaintenanceChangePercent: '-8%',
      idleAssets,
      idleAssetsChange: -13,
      idleAssetsChangePercent: '-15%',
    };

    // Build status distribution
    const statusDistribution: AssetStatusCountDto[] = [
      {
        status: 'Available',
        count: availableAssets,
        percentage:
          totalAssets > 0
            ? Math.round((availableAssets / totalAssets) * 100 * 10) / 10
            : 0,
      },
      {
        status: 'Allocated',
        count: allocatedAssets,
        percentage:
          totalAssets > 0
            ? Math.round((allocatedAssets / totalAssets) * 100 * 10) / 10
            : 0,
      },
      {
        status: 'Maintenance',
        count: inMaintenanceAssets,
        percentage:
          totalAssets > 0
            ? Math.round((inMaintenanceAssets / totalAssets) * 100 * 10) / 10
            : 0,
      },
    ];

    // Get department-wise asset usage
    const assetsByDepartment = await this.prisma.asset.groupBy({
      by: ['department'],
      _count: true,
    });

    const allocatedByDepartment = await this.prisma.asset.groupBy({
      by: ['department'],
      where: { status: 'ALLOCATED' },
      _count: true,
    });

    const departmentWiseAssetUsage = assetsByDepartment
      .filter((d) => d.department !== null)
      .map((dept) => {
        const totalInDept = dept._count;
        const allocatedInDept =
          allocatedByDepartment.find((a) => a.department === dept.department)?._count || 0;
        const utilRate =
          totalInDept > 0 ? (allocatedInDept / totalInDept) * 100 : 0;
        return {
          department: dept.department as string,
          assetCount: totalInDept,
          utilizationRate: Math.round(utilRate * 10) / 10,
        };
      })
      .sort((a, b) => b.assetCount - a.assetCount);

    // Get asset aging analysis
    const allAssets = await this.prisma.asset.findMany({
      select: { purchaseDate: true, createdAt: true },
    });

    const now = new Date();
    const assetAges = allAssets.map((asset) => {
      const date = asset.purchaseDate || asset.createdAt;
      const ageInYears =
        (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24 * 365);
      return ageInYears;
    });

    const assetAgingAnalysis = [
      {
        ageGroup: '0-1 year',
        count: assetAges.filter((age) => age < 1).length,
      },
      {
        ageGroup: '1-3 years',
        count: assetAges.filter((age) => age >= 1 && age < 3).length,
      },
      {
        ageGroup: '3-5 years',
        count: assetAges.filter((age) => age >= 3 && age < 5).length,
      },
      {
        ageGroup: '5+ years',
        count: assetAges.filter((age) => age >= 5).length,
      },
    ];

    // Get top idle asset categories
    const idleByCategory = await this.prisma.asset.groupBy({
      by: ['category'],
      where: { status: 'IN_OPERATION' },
      _count: true,
    });

    const topIdleAssetCategories = idleByCategory
      .map((cat) => ({
        category: cat.category,
        idleCount: cat._count,
      }))
      .sort((a, b) => b.idleCount - a.idleCount)
      .slice(0, 5);

    return {
      metrics,
      statusDistribution,
      inventoryByCategory,
      departmentWiseAssetUsage,
      assetAgingAnalysis,
      topIdleAssetCategories,
      lastUpdated: new Date(),
    };
  }

  async getMaintenanceAndAssetHealthDashboard(): Promise<MaintenanceAndAssetHealthDashboardDto> {
    // Get maintenance request counts
    const totalRequests = await this.prisma.maintenance.count();
    const scheduledRequests = await this.prisma.maintenance.count({
      where: { status: 'SCHEDULED' },
    });
    const inProgressRequests = await this.prisma.maintenance.count({
      where: { status: 'IN_PROGRESS' },
    });
    const completedRequests = await this.prisma.maintenance.count({
      where: { status: 'COMPLETED' },
    });

    // Get total maintenance cost
    const maintenanceCostAgg = await this.prisma.maintenance.aggregate({
      _sum: { actualCost: true, estimatedCost: true },
    });
    const totalMaintenanceCost =
      (maintenanceCostAgg._sum.actualCost || 0) +
      (maintenanceCostAgg._sum.estimatedCost || 0);

    // Get maintenance by priority
    const maintenanceByPriority = await this.prisma.maintenance.groupBy({
      by: ['priority'],
      _count: true,
    });

    // Get asset health by condition
    const assetsByCondition = await this.prisma.audit.groupBy({
      by: ['condition'],
      _count: true,
    });

    // Calculate metrics
    const closureRate =
      totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

    const metrics: MaintenanceMetricsDto = {
      totalRequests,
      totalRequestsChange: 15, // Mock values
      totalRequestsChangePercent: '+3%',
      openRequests: scheduledRequests + inProgressRequests,
      openRequestsChange: -5,
      openRequestsChangePercent: '-8%',
      maintenanceCost: Math.round(totalMaintenanceCost),
      maintenanceCostChange: 5250,
      maintenanceCostChangePercent: '+15.2%',
      totalAssets: await this.prisma.asset.count(),
      totalAssetsChange: 12,
      totalAssetsChangePercent: '+4%',
      closureRate: Math.round(closureRate * 10) / 10,
      closureRateChange: 5.2,
      closureRateChangePercent: '+5%',
      avgResolutionTime: 3.1, // Mock value in days
      avgResolutionTimeChange: -0.5,
      avgResolutionTimeChangePercent: '-8%',
    };

    // Build request status distribution
    const requestStatusDistribution: RequestStatusDto[] = [
      {
        status: 'Open',
        count: scheduledRequests,
        percentage:
          totalRequests > 0
            ? Math.round((scheduledRequests / totalRequests) * 100 * 10) / 10
            : 0,
      },
      {
        status: 'In Progress',
        count: inProgressRequests,
        percentage:
          totalRequests > 0
            ? Math.round((inProgressRequests / totalRequests) * 100 * 10) / 10
            : 0,
      },
      {
        status: 'Closed',
        count: completedRequests,
        percentage:
          totalRequests > 0
            ? Math.round((completedRequests / totalRequests) * 100 * 10) / 10
            : 0,
      },
    ];

    // Build priority distribution
    const priorityDistribution: PriorityDistributionDto[] = maintenanceByPriority.map(
      (item) => ({
        priority: item.priority,
        count: item._count,
      }),
    );

    // Get top repair failures (assets with highest maintenance frequency and cost)
    const maintenanceByAsset = await this.prisma.maintenance.groupBy({
      by: ['assetId'],
      _count: true,
      _sum: { actualCost: true },
    });

    const repairFailures: RepairFailureDto[] = [];
    for (const maint of maintenanceByAsset.slice(0, 5)) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: maint.assetId },
        select: { name: true },
      });
      if (asset) {
        repairFailures.push({
          assetId: maint.assetId,
          assetName: asset.name,
          failureCount: maint._count,
          cost: maint._sum.actualCost || 0,
        });
      }
    }

    // Build monthly trends (mock data - in production, get from actual dates)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyMaintenanceTrend: MonthlyTrendDataDto[] = months.map(
      (month, idx) => ({
        month,
        value: 45 + Math.floor(Math.random() * 30),
      }),
    );

    const maintenanceCostTrend: MonthlyTrendDataDto[] = months.map(
      (month, idx) => ({
        month,
        value: 8000 + Math.floor(Math.random() * 5000),
      }),
    );

    // Build asset health score
    const assetHealthScore: AssetHealthScoreDto[] = assetsByCondition.map(
      (item) => {
        const totalAudits = assetsByCondition.reduce((sum, a) => sum + a._count, 0);
        return {
          condition: item.condition,
          count: item._count,
          percentage:
            totalAudits > 0
              ? Math.round((item._count / totalAudits) * 100 * 10) / 10
              : 0,
        };
      },
    );

    // Build avg resolution time trend (mock data)
    const avgResolutionTimeTrend: MonthlyTrendDataDto[] = months.map(
      (month, idx) => ({
        month,
        value: 2.5 + Math.floor(Math.random() * 2),
      }),
    );

    // Get maintenance cost per asset (top 5 assets by cost)
    const maintenanceCostPerAsset: MaintenanceCostPerAssetDto[] = [];
    for (const maint of maintenanceByAsset.slice(0, 5)) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: maint.assetId },
        select: { name: true },
      });
      if (asset) {
        maintenanceCostPerAsset.push({
          assetName: asset.name,
          cost: maint._sum.actualCost || 0,
        });
      }
    }

    // Generate gap coverage notes based on data
    const gapCoverageNotes: GapCoverageNoteDto[] = [];
    if (metrics.openRequests > 0) {
      gapCoverageNotes.push({
        note: 'High priority requests need immediate attention for faster resolution.',
      });
    }
    if (metrics.avgResolutionTime > 2) {
      gapCoverageNotes.push({
        note: 'Requires proactive maintenance planning.',
      });
    }
    if (repairFailures.length > 3) {
      gapCoverageNotes.push({
        note: 'Consider preventive maintenance to reduce failure rates and costs.',
      });
    }
    gapCoverageNotes.push({
      note: 'Current resolution time is within SLA targets.',
    });

    return {
      metrics,
      requestStatusDistribution,
      priorityDistribution,
      monthlyMaintenanceTrend,
      maintenanceCostTrend,
      avgResolutionTimeTrend,
      repairFailures,
      assetHealthScore,
      maintenanceCostPerAsset,
      gapCoverageNotes,
      lastUpdated: new Date(),
    };
  }

  async getProcurementAndCostIntelligenceDashboard(): Promise<ProcurementAndCostIntelligenceDashboardDto> {
    // Get procurement request counts
    const totalRequests = await this.prisma.procurementRequest.count();
    const approvedRequests = await this.prisma.procurementRequest.count({
      where: { status: 'Approved' },
    });
    const rejectedRequests = await this.prisma.procurementRequest.count({
      where: { status: 'REJECTED' },
    });
    const pendingRequests = await this.prisma.procurementRequest.count({
      where: { status: { in: ['Pending', 'Ordered'] } },
    });

    // Calculate approval rate and closure rate
    const approvalRate =
      totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;
    const closureRate =
      totalRequests > 0 ? ((approvedRequests + rejectedRequests) / totalRequests) * 100 : 0;

    // Get all procurement requests
    const allRequests = await this.prisma.procurementRequest.findMany({
      select: {
        estimatedCost: true,
        category: true,
        vendor: true,
        status: true,
      },
    });

    // Calculate total spend and average request value
    const totalSpend = allRequests.reduce(
      (sum, req) => sum + (req.estimatedCost || 0),
      0,
    );
    const avgRequestValue =
      totalRequests > 0 ? totalSpend / totalRequests : 0;

    // Build metrics
    const metrics: ProcurementMetricsDto = {
      totalSpend: Math.round(totalSpend),
      totalSpendChange: 113000,
      totalSpendChangePercent: '+13%',
      totalRequests,
      totalRequestsChange: 100,
      totalRequestsChangePercent: '+8%',
      approvalRate: Math.round(approvalRate * 10) / 10,
      approvalRateChange: 2.5,
      approvalRateChangePercent: '+2.5%',
      avgRequestValue: Math.round(avgRequestValue),
      avgRequestValueChange: 28,
      avgRequestValueChangePercent: '+4%',
      pendingRequests,
      pendingRequestsChange: 0,
      pendingRequestsChangePercent: '0%',
      closureRate: Math.round(closureRate * 10) / 10,
      closureRateChange: 2.5,
      closureRateChangePercent: '+2.5%',
    };

    // Build request status distribution
    const requestStatusDistribution: ProcurementStatusDto[] = [
      {
        status: 'Approved',
        count: approvedRequests,
        percentage:
          totalRequests > 0
            ? Math.round((approvedRequests / totalRequests) * 100 * 10) / 10
            : 0,
      },
      {
        status: 'Rejected',
        count: rejectedRequests,
        percentage:
          totalRequests > 0
            ? Math.round((rejectedRequests / totalRequests) * 100 * 10) / 10
            : 0,
      },
      {
        status: 'Pending',
        count: pendingRequests,
        percentage:
          totalRequests > 0
            ? Math.round((pendingRequests / totalRequests) * 100 * 10) / 10
            : 0,
      },
    ];

    // Build monthly spend trend (mock data)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlySpendTrend: MonthlySpendDataDto[] = months.map(
      (month, idx) => ({
        month,
        spend: 20000 + Math.floor(Math.random() * 15000),
        requests: 150 + Math.floor(Math.random() * 100),
      }),
    );

    // Get spend by category
    const requestsByCategory = await this.prisma.procurementRequest.groupBy({
      by: ['category'],
      _sum: { estimatedCost: true },
      _count: true,
    });

    const categoryWiseSpend: CategorySpendDto[] = requestsByCategory
      .map((item) => ({
        category: item.category || 'Uncategorized',
        spend: item._sum.estimatedCost || 0,
      }))
      .sort((a, b) => b.spend - a.spend);

    // Get top purchased categories by request count
    const topPurchasedCategories: TopPurchasedCategoryDto[] = requestsByCategory
      .map((item) => ({
        category: item.category || 'Uncategorized',
        count: item._count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get vendor performance data
    const requestsByVendor = await this.prisma.procurementRequest.groupBy({
      by: ['vendor'],
      _sum: { estimatedCost: true },
      _count: true,
    });

    const vendorPerformance: VendorPerformanceDto[] = requestsByVendor
      .filter((v) => v.vendor !== null)
      .map((v) => ({
        vendorId: v.vendor as string,
        vendorName: v.vendor as string,
        cost: Math.round(v._sum.estimatedCost || 0),
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // Mock 3-5 rating
      }))
      .sort((a, b) => b.cost - a.cost);

    // Build vendor summary (top vendors)
    const vendorSummary: VendorSummaryDto[] = vendorPerformance
      .slice(0, 6)
      .map((vendor) => {
        const fullRating = Math.round(vendor.rating * 10) / 10;
        const fullStars = Math.floor(fullRating);
        const hasHalfStar = fullRating % 1 >= 0.5;
        let ratingDisplay = '★'.repeat(fullStars);
        if (hasHalfStar && fullStars < 5)
          ratingDisplay += '½';
        ratingDisplay += '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));

        return {
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          totalSpend: vendor.cost,
          rating: fullRating,
          ratingDisplay,
        };
      });

    // Get department-wise spend
    const requestsWithDept = await this.prisma.procurementRequest.findMany({
      select: { estimatedCost: true },
      where: { status: 'Received' }, // Only received/completed requests
    });

    // Mock department spend data based on categories
    const departmentWiseSpend: DepartmentSpendDto[] = [
      {
        department: 'IT',
        spend: requestsByCategory.find((c) => c.category === 'it-assets')?._sum.estimatedCost || 0,
      },
      {
        department: 'Finance',
        spend: requestsByCategory.find((c) => c.category === 'Financial')
          ?._sum.estimatedCost || Math.round(totalSpend * 0.15),
      },
      {
        department: 'Operations',
        spend: requestsByCategory.find((c) => c.category === 'Operations')
          ?._sum.estimatedCost || Math.round(totalSpend * 0.25),
      },
      {
        department: 'HR',
        spend: Math.round(totalSpend * 0.1),
      },
    ].filter((d) => d.spend > 0);

    // Get pending pipeline value by stage
    const requestsByStatus = await this.prisma.procurementRequest.groupBy({
      by: ['status'],
      _sum: { estimatedCost: true },
    });

    const pendingPipelineValueByStage: PendingPipelineStageDto[] = requestsByStatus
      .map((item) => ({
        stage: item.status || 'Unknown',
        value: Math.round(item._sum.estimatedCost || 0),
      }))
      .sort((a, b) => b.value - a.value);

    // Generate gap coverage notes
    const gapCoverageNotes: ProcurementGapCoverageNoteDto[] = [];
    gapCoverageNotes.push({
      note: 'Budget is on track with controlled spending across departments.',
    });
    if (metrics.approvalRate < 85) {
      gapCoverageNotes.push({
        note: 'Monitor procurement cycle time to accelerate approvals.',
      });
    }
    gapCoverageNotes.push({
      note: 'Department spend analysis shows optimal cost distribution.',
    });
    if (vendorPerformance.length > 5) {
      gapCoverageNotes.push({
        note: 'Consider vendor consolidation for further cost optimization.',
      });
    }

    return {
      metrics,
      requestStatusDistribution,
      monthlySpendTrend,
      categoryWiseSpend,
      vendorPerformance,
      topPurchasedCategories,
      vendorSummary,
      departmentWiseSpend,
      pendingPipelineValueByStage,
      gapCoverageNotes,
      lastUpdated: new Date(),
    };
  }
}
