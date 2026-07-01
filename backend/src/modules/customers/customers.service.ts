import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        companyId,
        ...(search
          ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search } }] }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        installments: { orderBy: { dueDate: 'asc' } },
        orders: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');
    return customer;
  }

  create(companyId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: { companyId, ...dto } });
  }

  async update(companyId: string, id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findFirst({ where: { id, companyId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, companyId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');
    await this.prisma.customer.delete({ where: { id } });
    return { success: true };
  }
}
