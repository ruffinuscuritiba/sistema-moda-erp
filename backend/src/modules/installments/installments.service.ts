import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InstallmentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InstallmentsService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string, status?: InstallmentStatus) {
    return this.prisma.installment.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
      },
      orderBy: { dueDate: 'asc' },
      include: { customer: { select: { id: true, name: true, phone: true } }, order: { select: { number: true } } },
    });
  }

  async markOverdue(companyId: string) {
    const now = new Date();
    return this.prisma.installment.updateMany({
      where: { companyId, status: InstallmentStatus.PENDING, dueDate: { lt: now } },
      data: { status: InstallmentStatus.OVERDUE },
    });
  }

  async pay(companyId: string, id: string) {
    const installment = await this.prisma.installment.findFirst({ where: { id, companyId } });
    if (!installment) throw new NotFoundException('Parcela não encontrada.');
    if (installment.status === InstallmentStatus.PAID) throw new BadRequestException('Parcela já está paga.');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.installment.update({
        where: { id },
        data: { status: InstallmentStatus.PAID, paidAt: new Date() },
      });
      await tx.customer.update({
        where: { id: installment.customerId },
        data: { creditBalance: { decrement: Number(installment.amount) } },
      });
      return updated;
    });
  }
}
