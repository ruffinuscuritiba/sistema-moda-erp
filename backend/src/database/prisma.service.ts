import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  isReady = false;

  async onModuleInit() {
    const attempts = 8;
    for (let i = 1; i <= attempts; i++) {
      try {
        await this.$connect();
        this.isReady = true;
        this.logger.log('Conectado ao banco de dados.');
        return;
      } catch (err) {
        this.logger.warn(`Tentativa ${i}/${attempts} de conexão com o banco falhou.`);
        if (i === attempts) throw err;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
