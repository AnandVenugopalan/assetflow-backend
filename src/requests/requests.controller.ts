import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../users/roles.decorator';
import { RolesGuard } from '../users/roles.guard';

@Controller('requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER', 'USER')
  findAll() {
    return this.requestsService.findAll();
  }

  @Post()
  @Roles('ADMIN', 'MANAGER', 'USER')
  create(@Body() createRequestDto: CreateRequestDto) {
    return this.requestsService.create(createRequestDto);
  }
}
