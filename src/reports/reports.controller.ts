import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('dashboard')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stats')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }
}
