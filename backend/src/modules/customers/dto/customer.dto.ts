import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'Informe o nome do cliente.' })
  name: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  cpf?: string;

  @IsOptional() @IsNumber() @Min(0)
  creditLimit?: number;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() @IsNotEmpty()
  name?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  cpf?: string;

  @IsOptional() @IsNumber() @Min(0)
  creditLimit?: number;
}
