import { Controller, Get, Post, Body, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { DepreciationService } from './depreciation.service';
import { CalculateDepreciationDto } from './dto/calculate-depreciation.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';

@Controller('depreciation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DepreciationController {
  constructor(private readonly depreciationService: DepreciationService) {}

  @Get('summary')
  @Roles('ADMIN', 'MANAGER', 'USER')
  async getSummary() {
    try {
      return await this.depreciationService.getSummary();
    } catch (error) {
      throw new HttpException('Failed to fetch depreciation summary', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('calculate')
  @Roles('ADMIN', 'MANAGER')
  async calculate(@Body() dto: CalculateDepreciationDto) {
    try {
      return await this.depreciationService.calculate(dto);
    } catch (error) {
      throw new HttpException(error.message || 'Failed to calculate depreciation', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('report')
  @Roles('ADMIN', 'MANAGER')
  async getReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    try {
      return await this.depreciationService.getReport({ startDate, endDate });
    } catch (error) {
      throw new HttpException('Failed to generate depreciation report', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}