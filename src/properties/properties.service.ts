import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertyDocument } from './property-document.interface';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.property.findUnique({
      where: { id },
    });
  }

  async create(createPropertyDto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: createPropertyDto,
    });
  }

  async saveDocument(
    propertyId: string,
    filename: string,
    path: string,
    type: string
  ): Promise<PropertyDocument> {
    // Your logic to save document (e.g., database insert)
    return {
      type,
      id: 'generated-id', // Replace with actual ID from DB
      filename,
      path,
      uploadedAt: new Date(),
      propertyId,
    };
  }

  async getDocuments(propertyId: string) {
    return this.prisma.propertyDocument.findMany({
      where: { propertyId },
    });
  }

  async deleteDocument(docId: string) {
    return this.prisma.propertyDocument.delete({
      where: { id: docId },
    });
  }
}
