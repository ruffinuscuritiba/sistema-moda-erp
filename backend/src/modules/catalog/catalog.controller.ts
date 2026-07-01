import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @UseGuards(JwtAuthGuard)
  @Get('visits')
  getVisitStats(@CompanyId() companyId: string) {
    return this.catalogService.getVisitStats(companyId);
  }

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(':slug')
  getPublicCatalog(@Param('slug') slug: string) {
    return this.catalogService.getPublicCatalog(slug);
  }

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post(':slug/visit')
  registerVisit(@Param('slug') slug: string, @Body('referrer') referrer: string, @Headers('user-agent') userAgent: string) {
    return this.catalogService.registerVisit(slug, referrer, userAgent);
  }
}
