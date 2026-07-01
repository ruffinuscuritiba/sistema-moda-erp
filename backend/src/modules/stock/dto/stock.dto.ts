import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdjustStockDto {
  @IsString() @IsNotEmpty()
  productVariantId: string;

  @IsIn(['ENTRY', 'EXIT', 'ADJUSTMENT', 'LOSS'])
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'LOSS';

  @IsInt()
  quantity: number;

  @IsOptional() @IsString()
  reason?: string;
}
