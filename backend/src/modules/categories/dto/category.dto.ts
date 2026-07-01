import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Informe o nome da categoria.' })
  name: string;
}

export class UpdateCategoryDto {
  @IsOptional() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsInt()
  sortOrder?: number;
}
