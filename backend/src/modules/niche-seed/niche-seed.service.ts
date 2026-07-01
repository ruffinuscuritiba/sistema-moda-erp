import { Injectable, Logger } from '@nestjs/common';
import { Segment } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SEGMENT_DATA } from './niche-seed.data';

/**
 * "Motor de criação" do onboarding: ao escolher o nicho no signup, popula
 * categorias e produtos de exemplo — a loja nasce pronta pra demonstração
 * em vez de uma tela vazia.
 */
@Injectable()
export class NicheSeedService {
  private readonly logger = new Logger(NicheSeedService.name);

  constructor(private prisma: PrismaService) {}

  async seedForCompany(companyId: string, segment: Segment): Promise<void> {
    const existing = await this.prisma.category.count({ where: { companyId } });
    if (existing > 0) return; // idempotente — nunca duplica em re-execuções

    const categories = SEGMENT_DATA[segment];

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const category = await this.prisma.category.create({
        data: { companyId, name: cat.name, sortOrder: i },
      });

      for (let j = 0; j < cat.products.length; j++) {
        const p = cat.products[j];
        const product = await this.prisma.product.create({
          data: {
            companyId,
            categoryId: category.id,
            name: p.name,
            costPrice: p.costPrice,
            salePrice: p.salePrice,
            isConsigned: p.isConsigned ?? false,
            sortOrder: j,
          },
        });

        for (const size of p.sizes) {
          for (const color of p.colors) {
            await this.prisma.productVariant.create({
              data: { productId: product.id, size, color, stock: 5, minimumStock: 2 },
            });
          }
        }
      }
    }

    this.logger.log(`Seed de nicho ${segment} aplicado para empresa ${companyId}.`);
  }
}
