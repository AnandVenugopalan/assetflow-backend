import { Module } from '@nestjs/common';
import { AllocationsService } from './allocations.service';
import { AllocationsController } from './allocations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
	imports: [PrismaModule, NotificationsModule],
	controllers: [AllocationsController],
	providers: [AllocationsService],
})
export class AllocationsModule {}


