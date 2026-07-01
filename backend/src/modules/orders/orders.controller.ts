import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/order.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query('status') status?: OrderStatus) {
    return this.ordersService.findAll(companyId, status);
  }

  @Get(':id')
  findOne(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.ordersService.findOne(companyId, id);
  }

  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(companyId, dto);
  }

  @Patch(':id/cancel')
  cancel(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.ordersService.cancel(companyId, id);
  }
}
