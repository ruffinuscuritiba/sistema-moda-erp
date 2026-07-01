import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { InstallmentStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { InstallmentsService } from './installments.service';

@UseGuards(JwtAuthGuard)
@Controller('installments')
export class InstallmentsController {
  constructor(private installmentsService: InstallmentsService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query('status') status?: InstallmentStatus) {
    return this.installmentsService.findAll(companyId, status);
  }

  @Patch(':id/pay')
  pay(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.installmentsService.pay(companyId, id);
  }
}
