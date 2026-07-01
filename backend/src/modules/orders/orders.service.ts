import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StockService } from '../stock/stock.service';
import { getEffectivePrice } from '../../common/utils/pricing';
import { CreateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
  ) {}

  findAll(companyId: string, status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { items: true, customer: { select: { id: true, name: true, phone: true } } },
      take: 200,
    });
  }

  async findOne(companyId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, companyId },
      include: { items: true, installments: true, customer: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    return order;
  }

  async create(companyId: string, dto: CreateOrderDto) {
    const variantIds = dto.items.map((i) => i.productVariantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { companyId } },
      include: { product: true },
    });

    if (variants.length !== new Set(variantIds).size) {
      throw new BadRequestException('Um ou mais itens do carrinho não pertencem a esta loja.');
    }
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;
    const lines = dto.items.map((item) => {
      const variant = variantMap.get(item.productVariantId)!;
      const product = variant.product;
      const unitPrice = getEffectivePrice(product);
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;

      const commissionAmount = product.isConsigned && product.commissionPercent
        ? Number((lineSubtotal * (Number(product.commissionPercent) / 100)).toFixed(2))
        : null;

      return {
        productId: product.id,
        productVariantId: variant.id,
        productName: product.name,
        size: variant.size,
        color: variant.color,
        unitPrice,
        quantity: item.quantity,
        subtotal: lineSubtotal,
        commissionAmount,
      };
    });

    const discount = dto.discount ?? 0;
    const total = Math.max(0, subtotal - discount);
    const installmentsCount = dto.paymentMethod === PaymentMethod.STORE_CREDIT ? dto.installmentsCount ?? 1 : 1;

    if (dto.paymentMethod === PaymentMethod.STORE_CREDIT) {
      if (!dto.customerId) throw new BadRequestException('Venda a crediário exige um cliente identificado.');
      const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, companyId } });
      if (!customer) throw new NotFoundException('Cliente não encontrado.');

      const projectedBalance = Number(customer.creditBalance) + total;
      if (projectedBalance > Number(customer.creditLimit)) {
        throw new BadRequestException('Limite de crédito do cliente insuficiente para esta venda.');
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const last = await tx.order.findFirst({ where: { companyId }, orderBy: { number: 'desc' } });
        const number = (last?.number ?? 0) + 1;

        const order = await tx.order.create({
          data: {
            companyId,
            customerId: dto.customerId,
            number,
            status: OrderStatus.COMPLETED,
            paymentMethod: dto.paymentMethod,
            subtotal,
            discount,
            total,
            installmentsCount,
            completedAt: new Date(),
            items: { create: lines },
          },
          include: { items: true },
        });

        for (const line of lines) {
          await this.stockService.consumeVariantTransactional(tx, companyId, line.productVariantId, line.quantity, order.id);
        }

        if (dto.paymentMethod === PaymentMethod.STORE_CREDIT && dto.customerId) {
          await this.createInstallments(tx, companyId, order.id, dto.customerId, total, installmentsCount);
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { creditBalance: { increment: total } },
          });
        }

        return order;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async createInstallments(
    tx: Prisma.TransactionClient,
    companyId: string,
    orderId: string,
    customerId: string,
    total: number,
    count: number,
  ) {
    const baseAmount = Math.floor((total / count) * 100) / 100;
    let allocated = 0;

    for (let i = 1; i <= count; i++) {
      const isLast = i === count;
      const amount = isLast ? Number((total - allocated).toFixed(2)) : baseAmount;
      allocated += amount;

      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      await tx.installment.create({
        data: { companyId, orderId, customerId, number: i, amount, dueDate, status: 'PENDING' },
      });
    }
  }

  async cancel(companyId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, companyId },
      include: { items: true, installments: true },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    if (order.status === OrderStatus.CANCELLED) throw new BadRequestException('Pedido já está cancelado.');

    const hasPaidInstallment = order.installments.some((i) => i.status === 'PAID');
    if (hasPaidInstallment) {
      throw new BadRequestException('Não é possível cancelar: já existem parcelas pagas para este pedido.');
    }

    return this.prisma.$transaction(
      async (tx) => {
        for (const item of order.items) {
          await this.stockService.restoreVariantTransactional(tx, companyId, item.productVariantId, item.quantity, order.id);
        }

        if (order.paymentMethod === PaymentMethod.STORE_CREDIT && order.customerId) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: { creditBalance: { decrement: Number(order.total) } },
          });
          await tx.installment.deleteMany({ where: { orderId: order.id } });
        }

        return tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
