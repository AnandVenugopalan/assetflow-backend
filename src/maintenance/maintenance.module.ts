import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
	imports: [PrismaModule, NotificationsModule],
	controllers: [MaintenanceController],
	providers: [MaintenanceService],
})
export class MaintenanceModule {}


