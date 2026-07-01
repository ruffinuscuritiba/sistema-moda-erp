import { IsBoolean, IsHexColor, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsHexColor({ message: 'Cor primária inválida.' })
  primaryColor?: string;

  @IsOptional() @IsHexColor({ message: 'Cor secundária inválida.' })
  secondaryColor?: string;

  @IsOptional() @IsHexColor({ message: 'Cor de fundo inválida.' })
  backgroundColor?: string;

  @IsOptional() @IsBoolean()
  darkMode?: boolean;

  @IsOptional() @IsString()
  logoUrl?: string;

  @IsOptional() @IsString()
  bannerUrl?: string;

  @IsOptional() @IsIn(['GRID', 'LIST'])
  layoutType?: string;

  @IsOptional() @IsIn(['SM', 'MD', 'LG', 'FULL'])
  buttonRadius?: string;
}
