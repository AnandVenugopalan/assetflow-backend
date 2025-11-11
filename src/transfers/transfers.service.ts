import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';

@Injectable()
export class TransfersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.transferRequest.findMany({
      include: {
        asset: true,
        approvedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.transferRequest.findUnique({
      where: { id },
      include: {
        asset: true,
        approvedBy: true,
      },
    });
  }

  async create(createTransferDto: CreateTransferDto) {
    return this.prisma.transferRequest.create({
      data: {
        ...createTransferDto,
        scheduledDate: createTransferDto.scheduledDate
          ? new Date(createTransferDto.scheduledDate)
          : null,
      },
      include: {
        asset: true,
      },
    });
  }

  async update(id: string, updateTransferDto: UpdateTransferDto) {
    return this.prisma.transferRequest.update({
      where: { id },
      data: {
        ...updateTransferDto,
        scheduledDate: updateTransferDto.scheduledDate
          ? new Date(updateTransferDto.scheduledDate)
          : undefined,
      },
      include: {
        asset: true,
      },
    });
  }
}
