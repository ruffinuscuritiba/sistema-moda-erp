import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.category.findMany({
      where: { companyId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async create(companyId: string, dto: CreateCategoryDto) {
    const max = await this.prisma.category.aggregate({ where: { companyId }, _max: { sortOrder: true } });
    return this.prisma.category.create({
      data: { companyId, name: dto.name, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    });
  }

  async update(companyId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({ where: { id, companyId } });
    if (!category) throw new NotFoundException('Categoria não encontrada.');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, companyId } });
    if (!category) throw new NotFoundException('Categoria não encontrada.');
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
