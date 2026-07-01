import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NicheSeedModule } from './modules/niche-seed/niche-seed.module';
import { CompanyModule } from './modules/company/company.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { StockModule } from './modules/stock/stock.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InstallmentsModule } from './modules/installments/installments.module';
import { ConditionalModule } from './modules/conditional/conditional.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    NicheSeedModule,
    CompanyModule,
    CategoriesModule,
    ProductsModule,
    CustomersModule,
    StockModule,
    OrdersModule,
    InstallmentsModule,
    ConditionalModule,
    CatalogModule,
    UsersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
