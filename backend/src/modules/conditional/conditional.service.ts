import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConditionalStatus, OrderStatus, PaymentMethod, Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { getEffectivePrice } from '../../common/utils/pricing';
import { CreateConditionalDto, ResolveConditionalDto } from './dto/conditional.dto';

@Injectable()
export class ConditionalService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string, status?: ConditionalStatus) {
    return this.prisma.conditionalCheckout.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: { include: { productVariant: { include: { product: { select: { name: true, imageUrl: true } } } } } },
      },
    });
  }

  async create(companyId: string, dto: CreateConditionalDto) {
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, companyId } });
    if (!customer) throw new NotFoundException('Cliente não encontrado.');

    const variantIds = dto.items.map((i) => i.productVariantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds }, product: { companyId } },
      include: { product: true },
    });
    if (variants.length !== new Set(variantIds).size) {
      throw new BadRequestException('Uma ou mais peças não pertencem a esta loja.');
    }
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    for (const item of dto.items) {
      const variant = variantMap.get(item.productVariantId)!;
      if (variant.stock < item.quantity) {
        throw new BadRequestException(`Estoque insuficiente para levar a peça (disponível: ${variant.stock}).`);
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const checkout = await tx.conditionalCheckout.create({
          data: {
            companyId,
            customerId: dto.customerId,
            dueAt: new Date(dto.dueAt),
            notes: dto.notes,
            status: ConditionalStatus.OUT,
            items: {
              create: dto.items.map((item) => {
                const variant = variantMap.get(item.productVariantId)!;
                return {
                  productVariantId: item.productVariantId,
                  quantity: item.quantity,
                  unitPrice: getEffectivePrice(variant.product),
                };
              }),
            },
          },
          include: { items: true },
        });

        for (const item of dto.items) {
          const variant = variantMap.get(item.productVariantId)!;
          const currentStock = variant.stock - item.quantity;
          await tx.productVariant.update({ where: { id: variant.id }, data: { stock: currentStock } });
          await tx.stockMovement.create({
            data: {
              companyId,
              productVariantId: variant.id,
              type: StockMovementType.EXIT,
              previousStock: variant.stock,
              currentStock,
              quantity: item.quantity,
              reason: 'Condicional — levou pra provar',
              referenceId: checkout.id,
            },
          });
        }

        return checkout;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /** Fecha o condicional: itens em keptVariantIds viram venda, o resto volta pro estoque. */
  async resolve(companyId: string, id: string, dto: ResolveConditionalDto) {
    const checkout = await this.prisma.conditionalCheckout.findFirst({
      where: { id, companyId },
      include: { items: { include: { productVariant: { include: { product: true } } } } },
    });
    if (!checkout) throw new NotFoundException('Condicional não encontrado.');
    if (checkout.status !== ConditionalStatus.OUT) {
      throw new BadRequestException('Este condicional já foi encerrado.');
    }

    const keptSet = new Set(dto.keptVariantIds);

    return this.prisma.$transaction(
      async (tx) => {
        let subtotal = 0;
        const orderLines: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];

        for (const item of checkout.items) {
          const kept = keptSet.has(item.productVariantId);
          if (kept) {
            const lineSubtotal = Number(item.unitPrice) * item.quantity;
            subtotal += lineSubtotal;
            orderLines.push({
              productId: item.productVariant.product.id,
              productVariantId: item.productVariantId,
              productName: item.productVariant.product.name,
              size: item.productVariant.size,
              color: item.productVariant.color,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: lineSubtotal,
            });
            await tx.conditionalItem.update({ where: { id: item.id }, data: { sold: true } });
          } else {
            const variant = item.productVariant;
            const currentStock = variant.stock + item.quantity;
            await tx.productVariant.update({ where: { id: variant.id }, data: { stock: currentStock } });
            await tx.stockMovement.create({
              data: {
                companyId,
                productVariantId: variant.id,
                type: StockMovementType.RETURN,
                previousStock: variant.stock,
                currentStock,
                quantity: item.quantity,
                reason: 'Condicional — devolução',
                referenceId: checkout.id,
              },
            });
            await tx.conditionalItem.update({ where: { id: item.id }, data: { returned: true } });
          }
        }

        let convertedOrderId: string | undefined;
        if (orderLines.length > 0) {
          const last = await tx.order.findFirst({ where: { companyId }, orderBy: { number: 'desc' } });
          const order = await tx.order.create({
            data: {
              companyId,
              customerId: checkout.customerId,
              number: (last?.number ?? 0) + 1,
              status: OrderStatus.COMPLETED,
              paymentMethod: dto.paymentMethod ?? PaymentMethod.CASH,
              subtotal,
              total: subtotal,
              completedAt: new Date(),
              items: { create: orderLines },
            },
          });
          convertedOrderId = order.id;
        }

        const allKept = keptSet.size === checkout.items.length;
        const noneKept = keptSet.size === 0;
        const status = allKept ? ConditionalStatus.CONVERTED : noneKept ? ConditionalStatus.RETURNED : ConditionalStatus.PARTIAL;

        return tx.conditionalCheckout.update({
          where: { id: checkout.id },
          data: { status, returnedAt: new Date(), convertedOrderId },
          include: { items: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
