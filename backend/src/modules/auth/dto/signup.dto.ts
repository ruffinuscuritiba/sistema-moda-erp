import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { Segment } from '@prisma/client';

export class SignupDto {
  @IsNotEmpty({ message: 'Informe o nome da loja.' })
  companyName: string;

  @IsEnum(Segment, { message: 'Selecione um nicho válido.' })
  segment: Segment;

  @IsNotEmpty({ message: 'Informe o seu nome.' })
  name: string;

  @IsEmail({}, { message: 'E-mail inválido.' })
  email: string;

  @MinLength(6, { message: 'A senha deve ter ao menos 6 caracteres.' })
  password: string;
}
