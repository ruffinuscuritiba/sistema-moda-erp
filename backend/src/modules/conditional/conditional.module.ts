import { Module } from '@nestjs/common';
import { ConditionalService } from './conditional.service';
import { ConditionalController } from './conditional.controller';

@Module({
  controllers: [ConditionalController],
  providers: [ConditionalService],
})
export class ConditionalModule {}
