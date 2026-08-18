import { IsString, MinLength } from 'class-validator';

export class CreateConnectionDto {
  @IsString() @MinLength(2)
  name: string;
}
