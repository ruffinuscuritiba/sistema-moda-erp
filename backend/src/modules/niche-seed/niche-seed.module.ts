import { Module } from '@nestjs/common';
import { NicheSeedService } from './niche-seed.service';

@Module({
  providers: [NicheSeedService],
  exports: [NicheSeedService],
})
export class NicheSeedModule {}
