import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductCondition } from '@prisma/client';

export class VariantInputDto {
  @IsString() @IsNotEmpty()
  size: string;

  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsString()
  barcode?: string;

  @IsInt() @Min(0)
  stock: number;

  @IsOptional() @IsInt() @Min(0)
  minimumStock?: number;
}

export class CreateProductDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsString()
  sku?: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsNumber() @Min(0)
  costPrice: number;

  @IsNumber() @Min(0)
  salePrice: number;

  // Consignação (brechó)
  @IsOptional() @IsBoolean()
  isConsigned?: boolean;

  @IsOptional() @IsString()
  consignorName?: string;

  @IsOptional() @IsString()
  consignorPhone?: string;

  @IsOptional() @IsNumber() @Min(0)
  commissionPercent?: number;

  // Estado da peça / defeito
  @IsOptional() @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @IsOptional() @IsString()
  defectNotes?: string;

  @IsOptional() @IsString()
  defectPhotoUrl?: string;

  // Promoção
  @IsOptional() @IsBoolean()
  isOnSale?: boolean;

  @IsOptional() @IsNumber() @Min(0)
  promoPrice?: number;

  @IsOptional() @IsDateString()
  saleStartsAt?: string;

  @IsOptional() @IsDateString()
  saleEndsAt?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => VariantInputDto)
  variants: VariantInputDto[];
}

export class UpdateProductDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  categoryId?: string;

  @IsOptional() @IsString()
  sku?: string;

  @IsOptional() @IsString()
  imageUrl?: string;

  @IsOptional() @IsNumber() @Min(0)
  costPrice?: number;

  @IsOptional() @IsNumber() @Min(0)
  salePrice?: number;

  @IsOptional() @IsBoolean()
  isConsigned?: boolean;

  @IsOptional() @IsString()
  consignorName?: string;

  @IsOptional() @IsString()
  consignorPhone?: string;

  @IsOptional() @IsNumber() @Min(0)
  commissionPercent?: number;

  @IsOptional() @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @IsOptional() @IsString()
  defectNotes?: string;

  @IsOptional() @IsString()
  defectPhotoUrl?: string;

  @IsOptional() @IsBoolean()
  isOnSale?: boolean;

  @IsOptional() @IsNumber() @Min(0)
  promoPrice?: number;

  @IsOptional() @IsDateString()
  saleStartsAt?: string;

  @IsOptional() @IsDateString()
  saleEndsAt?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VariantInputDto)
  variants?: VariantInputDto[];
}
