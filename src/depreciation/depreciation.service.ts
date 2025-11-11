import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculateDepreciationDto } from './dto/calculate-depreciation.dto';

@Injectable()
export class DepreciationService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const assets = await this.prisma.asset.findMany({
      where: {
        purchaseCost: { not: null },
        currentValue: { not: null },
      },
      select: {
        id: true,
        name: true,
        purchaseCost: true,
        currentValue: true,
        purchaseDate: true,
      },
    });

    const totalPurchaseCost = assets.reduce((sum, asset) => sum + (asset.purchaseCost || 0), 0);
    const totalCurrentValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    const totalDepreciation = totalPurchaseCost - totalCurrentValue;

    return {
      totalAssets: assets.length,
      totalPurchaseCost,
      totalCurrentValue,
      totalDepreciation,
      assets: assets.map(asset => ({
        id: asset.id,
        name: asset.name,
        purchaseCost: asset.purchaseCost,
        currentValue: asset.currentValue,
        depreciation: (asset.purchaseCost || 0) - (asset.currentValue || 0),
      })),
    };
  }

  async calculate(dto: CalculateDepreciationDto) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
      select: {
        id: true,
        name: true,
        purchaseCost: true,
        purchaseDate: true,
        currentValue: true,
      },
    });

    if (!asset || !asset.purchaseCost) {
      throw new Error('Asset not found or no purchase cost available');
    }

    const cost = asset.purchaseCost;
    const salvageValue = dto.salvageValue || 0;
    const usefulLife = dto.usefulLife || 5; // Default 5 years
    const currentValue = asset.currentValue || cost;

    let depreciation = 0;
    let method = '';

    if (dto.method === 'slm') {
      // Straight Line Method
      const depreciableAmount = cost - salvageValue;
      depreciation = depreciableAmount / usefulLife;
      method = 'Straight Line Method';
    } else if (dto.method === 'wdv') {
      // Written Down Value Method (simplified)
      const rate = 1 / usefulLife;
      depreciation = currentValue * rate;
      method = 'Written Down Value Method';
    }

    return {
      assetId: asset.id,
      assetName: asset.name,
      method,
      originalCost: cost,
      currentValue,
      depreciation,
      newValue: Math.max(currentValue - depreciation, salvageValue),
      calculationDate: new Date(),
    };
  }

  async getReport(params?: { startDate?: string; endDate?: string }) {
    const assets = await this.prisma.asset.findMany({
      where: {
        purchaseCost: { not: null },
      },
      select: {
        id: true,
        name: true,
        category: true,
        purchaseCost: true,
        currentValue: true,
        purchaseDate: true,
      },
      orderBy: { purchaseDate: 'desc' },
    });

    const report = assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      purchaseDate: asset.purchaseDate,
      purchaseCost: asset.purchaseCost,
      currentValue: asset.currentValue || asset.purchaseCost,
      depreciation: (asset.purchaseCost || 0) - (asset.currentValue || asset.purchaseCost || 0),
      depreciationPercentage: asset.purchaseCost ?
        (((asset.purchaseCost - (asset.currentValue || asset.purchaseCost)) / asset.purchaseCost) * 100).toFixed(2) + '%' : '0%',
    }));

    return {
      generatedAt: new Date(),
      totalAssets: assets.length,
      assets: report,
    };
  }
}