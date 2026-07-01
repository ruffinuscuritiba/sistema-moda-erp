import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class OrderItemInputDto {
  @IsString()
  productVariantId: string;

  @IsInt() @IsPositive()
  quantity: number;
}

export class CreateOrderDto {
  @IsOptional() @IsString()
  customerId?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional() @IsNumber() @Min(0)
  discount?: number;

  @IsOptional() @IsInt() @Min(1)
  installmentsCount?: number;

  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];
}
