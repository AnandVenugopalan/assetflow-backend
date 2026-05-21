import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePoDto, UpdatePoDto } from './dto/po.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../users/roles.guard';
import { Roles } from '../users/roles.decorator';

@Controller('purchase-orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Post()
  @Roles('ADMIN', 'PURCHASE_HEAD')
  create(@Body() createPoDto: CreatePoDto) {
    return this.poService.create(createPoDto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'PURCHASE_HEAD', 'FINANCE_MANAGER')
  findAll() {
    return this.poService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'PURCHASE_HEAD', 'FINANCE_MANAGER')
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PURCHASE_HEAD')
  update(@Param('id') id: string, @Body() updatePoDto: UpdatePoDto) {
    return this.poService.update(id, updatePoDto);
  }

  @Patch(':id/ordered')
  @Roles('ADMIN', 'PURCHASE_HEAD')
  markAsOrdered(@Param('id') id: string) {
    return this.poService.markAsOrdered(id);
  }

  @Patch(':id/completed')
  @Roles('ADMIN', 'PURCHASE_HEAD', 'MANAGER')
  markAsCompleted(@Param('id') id: string) {
    return this.poService.markAsCompleted(id);
  }
}
