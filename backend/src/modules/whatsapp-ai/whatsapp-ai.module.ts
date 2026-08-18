import { Module } from '@nestjs/common';
import { WhatsappAiController } from './whatsapp-ai.controller';
import { WhatsappAiService } from './whatsapp-ai.service';
import { EvolutionClientService } from './services/evolution-client.service';
import { EvolutionProvisionService } from './services/evolution-provision.service';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [ProductsModule, OrdersModule],
  controllers: [WhatsappAiController],
  providers: [WhatsappAiService, EvolutionClientService, EvolutionProvisionService],
})
export class WhatsappAiModule {}
