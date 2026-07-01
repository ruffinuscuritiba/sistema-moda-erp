import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CompanyModule } from '../company/company.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [CompanyModule, ProductsModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
