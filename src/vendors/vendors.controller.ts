import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../users/roles.guard';
import { Roles } from '../users/roles.decorator';

@Controller('vendors')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Roles('ADMIN', 'PURCHASE_HEAD')
  create(@Body() createVendorDto: CreateVendorDto) {
    try {
      return this.vendorsService.create(createVendorDto);
    } catch {
      throw new HttpException('Failed to create vendor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'PURCHASE_HEAD', 'FINANCE_MANAGER', 'USER', 'DEPARTMENT_USER')
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'MANAGER', 'PURCHASE_HEAD', 'FINANCE_MANAGER', 'USER', 'DEPARTMENT_USER')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PURCHASE_HEAD')
  update(@Param('id') id: string, @Body() updateVendorDto: UpdateVendorDto) {
    return this.vendorsService.update(id, updateVendorDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }
}
