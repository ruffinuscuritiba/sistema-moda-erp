import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { StockService } from './stock.service';
import { AdjustStockDto } from './dto/stock.dto';

@UseGuards(JwtAuthGuard)
@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @Get('movements')
  findMovements(@CompanyId() companyId: string, @Query('productVariantId') productVariantId?: string) {
    return this.stockService.findMovements(companyId, productVariantId);
  }

  @Get('low')
  lowStock(@CompanyId() companyId: string) {
    return this.stockService.lowStock(companyId);
  }

  @Post('adjust')
  adjust(@CompanyId() companyId: string, @Body() dto: AdjustStockDto) {
    return this.stockService.adjust(companyId, dto);
  }
}
