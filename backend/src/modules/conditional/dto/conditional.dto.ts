import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsInt, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class ConditionalItemInputDto {
  @IsString()
  productVariantId: string;

  @IsInt() @IsPositive()
  quantity: number;
}

export class CreateConditionalDto {
  @IsString()
  customerId: string;

  @IsDateString()
  dueAt: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ConditionalItemInputDto)
  items: ConditionalItemInputDto[];
}

export class ResolveConditionalDto {
  /** IDs de ProductVariant que o cliente decidiu comprar — o restante volta pro estoque. */
  @IsArray() @IsString({ each: true })
  keptVariantIds: string[];

  @IsOptional() @IsString()
  paymentMethod?: PaymentMethod;
}
