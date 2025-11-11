import { Module } from '@nestjs/common';
import { DisposalsService } from './disposals.service';
import { DisposalsController } from './disposals.controller';

@Module({
	controllers: [DisposalsController],
	providers: [DisposalsService],
})
export class DisposalsModule {}


