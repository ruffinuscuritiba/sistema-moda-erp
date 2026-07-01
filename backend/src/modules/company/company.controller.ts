import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { CompanyService } from './company.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('company')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  // Rotas públicas ANTES das autenticadas com path fixo — sem conflito de rota aqui pois usam prefixo "public".
  @Get('public/:slug')
  getPublic(@Param('slug') slug: string) {
    return this.companyService.getPublicBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  getSettings(@CompanyId() companyId: string) {
    return this.companyService.getSettings(companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Patch('settings')
  updateSettings(@CompanyId() companyId: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.updateSettings(companyId, dto);
  }
}
