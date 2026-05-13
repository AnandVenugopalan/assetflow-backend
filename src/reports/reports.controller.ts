import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AssetUtilizationDashboardDto } from './dto/asset-utilization-dashboard.dto';
import { MaintenanceAndAssetHealthDashboardDto } from './dto/maintenance-asset-health-dashboard.dto';
import { ProcurementAndCostIntelligenceDashboardDto } from './dto/procurement-cost-intelligence-dashboard.dto';

@Controller('dashboard')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  @Get('asset-utilization')
  async getAssetUtilizationDashboard(): Promise<AssetUtilizationDashboardDto> {
    return this.reportsService.getAssetUtilizationDashboard();
  }

  @Get('maintenance-asset-health')
  async getMaintenanceAndAssetHealthDashboard(): Promise<MaintenanceAndAssetHealthDashboardDto> {
    return this.reportsService.getMaintenanceAndAssetHealthDashboard();
  }

  @Get('procurement-cost-intelligence')
  async getProcurementAndCostIntelligenceDashboard(): Promise<ProcurementAndCostIntelligenceDashboardDto> {
    return this.reportsService.getProcurementAndCostIntelligenceDashboard();
  }
}
