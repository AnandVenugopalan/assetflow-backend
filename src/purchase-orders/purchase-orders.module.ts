import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [PrismaModule, AssetsModule],
  providers: [PurchaseOrdersService],
  controllers: [PurchaseOrdersController],
  exports: [PurchaseOrdersService]
})
export class PurchaseOrdersModule {}
