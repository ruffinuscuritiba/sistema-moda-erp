import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ConditionalStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { ConditionalService } from './conditional.service';
import { CreateConditionalDto, ResolveConditionalDto } from './dto/conditional.dto';

@UseGuards(JwtAuthGuard)
@Controller('conditional')
export class ConditionalController {
  constructor(private conditionalService: ConditionalService) {}

  @Get()
  findAll(@CompanyId() companyId: string, @Query('status') status?: ConditionalStatus) {
    return this.conditionalService.findAll(companyId, status);
  }

  @Post()
  create(@CompanyId() companyId: string, @Body() dto: CreateConditionalDto) {
    return this.conditionalService.create(companyId, dto);
  }

  @Patch(':id/resolve')
  resolve(@CompanyId() companyId: string, @Param('id') id: string, @Body() dto: ResolveConditionalDto) {
    return this.conditionalService.resolve(companyId, id, dto);
  }
}
