import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { getEffectivePrice } from '../../common/utils/pricing';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(companyId: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: { companyId, deletedAt: null, ...(categoryId ? { categoryId } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { variants: true, category: { select: { id: true, name: true } } },
    });
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { variants: true, category: { select: { id: true, name: true } } },
    });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    return product;
  }

  async create(companyId: string, dto: CreateProductDto) {
    const max = await this.prisma.product.aggregate({ where: { companyId }, _max: { sortOrder: true } });

    return this.prisma.product.create({
      data: {
        companyId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        sku: dto.sku,
        imageUrl: dto.imageUrl,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        isConsigned: dto.isConsigned ?? false,
        consignorName: dto.consignorName,
        consignorPhone: dto.consignorPhone,
        commissionPercent: dto.commissionPercent,
        condition: dto.condition,
        defectNotes: dto.defectNotes,
        defectPhotoUrl: dto.defectPhotoUrl,
        isOnSale: dto.isOnSale ?? false,
        promoPrice: dto.promoPrice,
        saleStartsAt: dto.saleStartsAt ? new Date(dto.saleStartsAt) : undefined,
        saleEndsAt: dto.saleEndsAt ? new Date(dto.saleEndsAt) : undefined,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
        variants: {
          create: dto.variants.map((v) => ({
            size: v.size,
            color: v.color ?? 'Único',
            barcode: v.barcode,
            stock: v.stock,
            minimumStock: v.minimumStock ?? 0,
          })),
        },
      },
      include: { variants: true },
    });
  }

  async update(companyId: string, id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!product) throw new NotFoundException('Produto não encontrado.');

    const { variants, saleStartsAt, saleEndsAt, ...rest } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        await tx.productVariant.createMany({
          data: variants.map((v) => ({
            productId: id,
            size: v.size,
            color: v.color ?? 'Único',
            barcode: v.barcode,
            stock: v.stock,
            minimumStock: v.minimumStock ?? 0,
          })),
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          ...rest,
          saleStartsAt: saleStartsAt ? new Date(saleStartsAt) : undefined,
          saleEndsAt: saleEndsAt ? new Date(saleEndsAt) : undefined,
        },
        include: { variants: true },
      });
    });
  }

  async remove(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!product) throw new NotFoundException('Produto não encontrado.');
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { success: true };
  }

  /** Catálogo digital público — só peças ativas, com preço efetivo calculado. */
  async publicCatalog(companyId: string) {
    const products = await this.prisma.product.findMany({
      where: { companyId, deletedAt: null, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { variants: true, category: { select: { id: true, name: true } } },
    });

    return products.map((p) => ({
      ...p,
      effectivePrice: getEffectivePrice(p),
      totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    }));
  }
}
