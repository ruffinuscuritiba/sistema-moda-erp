import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

const SETTINGS_SELECT = {
  id: true,
  name: true,
  slug: true,
  segment: true,
  primaryColor: true,
  secondaryColor: true,
  backgroundColor: true,
  darkMode: true,
  logoUrl: true,
  bannerUrl: true,
  layoutType: true,
  buttonRadius: true,
};

const PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  segment: true,
  primaryColor: true,
  secondaryColor: true,
  backgroundColor: true,
  darkMode: true,
  logoUrl: true,
  bannerUrl: true,
  layoutType: true,
  buttonRadius: true,
};

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  getSettings(companyId: string) {
    return this.prisma.company.findUnique({ where: { id: companyId }, select: SETTINGS_SELECT });
  }

  updateSettings(companyId: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({ where: { id: companyId }, data: dto, select: SETTINGS_SELECT });
  }

  async getPublicBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({ where: { slug }, select: PUBLIC_SELECT });
    if (!company) throw new NotFoundException('Loja não encontrada.');
    return company;
  }

  async resolveIdBySlug(slug: string): Promise<string> {
    const company = await this.prisma.company.findUnique({ where: { slug }, select: { id: true } });
    if (!company) throw new NotFoundException('Loja não encontrada.');
    return company.id;
  }
}
