import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { WhatsappAiService } from './whatsapp-ai.service';
import { CreateConnectionDto } from './dto/create-connection.dto';

@Controller('whatsapp-ai')
export class WhatsappAiController {
  constructor(private whatsappAiService: WhatsappAiService) {}

  @Post('webhook/:connectionId')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  webhook(@Param('connectionId') connectionId: string, @Body() body: Record<string, unknown>) {
    return this.whatsappAiService.handleEvolutionWebhook(connectionId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('connections')
  listConnections(@CompanyId() companyId: string) {
    return this.whatsappAiService.listConnections(companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('connections')
  createConnection(@CompanyId() companyId: string, @Body() dto: CreateConnectionDto) {
    return this.whatsappAiService.createConnection(companyId, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @Get('connections/:id/qr')
  getConnectionQr(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.whatsappAiService.getConnectionQr(companyId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('connections/:id')
  deleteConnection(@CompanyId() companyId: string, @Param('id') id: string) {
    return this.whatsappAiService.deleteConnection(companyId, id);
  }
}
