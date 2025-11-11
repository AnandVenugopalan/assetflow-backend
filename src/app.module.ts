import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { LifecycleModule } from './lifecycle/lifecycle.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { AllocationsModule } from './allocations/allocations.module';
import { DisposalsModule } from './disposals/disposals.module';
import { PropertiesModule } from './properties/properties.module';
import { RequestsModule } from './requests/requests.module';
import { ProcurementModule } from './procurement/procurement.module';
import { TransfersModule } from './transfers/transfers.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { DepreciationModule } from './depreciation/depreciation.module';

@Module({
	imports: [
		PrismaModule,
		AuthModule,
		UsersModule,
		AssetsModule,
		LifecycleModule,
		MaintenanceModule,
		AllocationsModule,
		DisposalsModule,
		PropertiesModule,
		RequestsModule,
		ProcurementModule,
		TransfersModule,
		ReportsModule,
		AuditModule,
		DepreciationModule,
	],
})
export class AppModule {}
