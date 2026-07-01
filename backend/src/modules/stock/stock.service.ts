import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AdjustStockDto } from './dto/stock.dto';

type Tx = Prisma.TransactionClient;

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  /** Consome estoque de uma variante dentro de uma transação de pedido (venda). */
  async consumeVariantTransactional(
    tx: Tx,
    companyId: string,
    productVariantId: string,
    quantity: number,
    referenceId: string,
  ) {
    const variant = await tx.productVariant.findUnique({ where: { id: productVariantId } });
    if (!variant) throw new NotFoundException('Variante de produto não encontrada.');
    if (variant.stock < quantity) {
      throw new BadRequestException(`Estoque insuficiente para o item (disponível: ${variant.stock}).`);
    }

    const currentStock = variant.stock - quantity;
    await tx.productVariant.update({ where: { id: productVariantId }, data: { stock: currentStock } });
    await tx.stockMovement.create({
      data: {
        companyId,
        productVariantId,
        type: StockMovementType.SALE,
        previousStock: variant.stock,
        currentStock,
        quantity,
        referenceId,
      },
    });
  }

  /** Restaura estoque (cancelamento de pedido / devolução de condicional). */
  async restoreVariantTransactional(
    tx: Tx,
    companyId: string,
    productVariantId: string,
    quantity: number,
    referenceId: string,
  ) {
    const variant = await tx.productVariant.findUnique({ where: { id: productVariantId } });
    if (!variant) throw new NotFoundException('Variante de produto não encontrada.');

    const currentStock = variant.stock + quantity;
    await tx.productVariant.update({ where: { id: productVariantId }, data: { stock: currentStock } });
    await tx.stockMovement.create({
      data: {
        companyId,
        productVariantId,
        type: StockMovementType.RETURN,
        previousStock: variant.stock,
        currentStock,
        quantity,
        referenceId,
      },
    });
  }

  async adjust(companyId: string, dto: AdjustStockDto) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: dto.productVariantId, product: { companyId } },
    });
    if (!variant) throw new NotFoundException('Variante de produto não encontrada.');

    const delta = dto.type === 'ENTRY' ? Math.abs(dto.quantity) : dto.type === 'ADJUSTMENT' ? dto.quantity : -Math.abs(dto.quantity);
    const currentStock = variant.stock + delta;
    if (currentStock < 0) throw new BadRequestException('O ajuste deixaria o estoque negativo.');

    return this.prisma.$transaction(async (tx) => {
      await tx.productVariant.update({ where: { id: variant.id }, data: { stock: currentStock } });
      return tx.stockMovement.create({
        data: {
          companyId,
          productVariantId: variant.id,
          type: dto.type,
          previousStock: variant.stock,
          currentStock,
          quantity: Math.abs(delta),
          reason: dto.reason,
        },
      });
    });
  }

  findMovements(companyId: string, productVariantId?: string) {
    return this.prisma.stockMovement.findMany({
      where: { companyId, ...(productVariantId ? { productVariantId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { productVariant: { include: { product: { select: { name: true } } } } },
    });
  }

  async lowStock(companyId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { product: { companyId, deletedAt: null } },
      include: { product: { select: { id: true, name: true, imageUrl: true } } },
    });
    return variants.filter((v) => v.stock <= v.minimumStock);
  }
}
