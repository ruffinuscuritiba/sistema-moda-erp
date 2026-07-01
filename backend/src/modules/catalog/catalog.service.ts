import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CompanyService } from '../company/company.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CatalogService {
  constructor(
    private prisma: PrismaService,
    private companyService: CompanyService,
    private productsService: ProductsService,
  ) {}

  async getPublicCatalog(slug: string) {
    const company = await this.companyService.getPublicBySlug(slug);

    const [categories, products] = await Promise.all([
      this.prisma.category.findMany({ where: { companyId: company.id }, orderBy: { sortOrder: 'asc' } }),
      this.productsService.publicCatalog(company.id),
    ]);

    return { company, categories, products };
  }

  async registerVisit(slug: string, referrer?: string, userAgent?: string) {
    const companyId = await this.companyService.resolveIdBySlug(slug);
    await this.prisma.catalogVisit.create({ data: { companyId, referrer, userAgent } });
    return { success: true };
  }

  async getVisitStats(companyId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, last7Days, last30Days] = await Promise.all([
      this.prisma.catalogVisit.count({ where: { companyId } }),
      this.prisma.catalogVisit.count({ where: { companyId, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.catalogVisit.count({ where: { companyId, createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return { total, last7Days, last30Days };
  }
}
